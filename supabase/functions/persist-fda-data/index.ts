import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface DrugApproval {
  approvalMonth: string;
  approvalDate: string;
  ndaBlaNumber: string;
  applicationNo: string;
  applicationType: string;
  brandName: string;
  activeIngredient: string;
  sponsor: string;
  indicationFull: string;
  therapeuticArea: string;
  isOncology: boolean;
  isBiosimilar: boolean;
  isNovelDrug: boolean;
  isOrphanDrug: boolean;
  isCberProduct?: boolean;
  approvalType: string;
  supplementCategory?: string;
  notes: string;
  fdaUrl?: string;
}

interface SaveRequest {
  action: "save";
  data: DrugApproval[];
  notes?: string;
}

interface LoadRequest {
  action: "load";
}

type RequestBody = SaveRequest | LoadRequest;

// Build fingerprint for data (same logic as frontend)
function createDataFingerprint(data: DrugApproval[]): string {
  if (data.length === 0) return "empty";
  const first = data[0];
  const last = data[data.length - 1];
  const idsLen = data.reduce((acc, d) => acc + (d.applicationNo?.length || 0), 0);
  return `v2-${data.length}-${first?.applicationNo || ""}-${last?.applicationNo || ""}-${idsLen}`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // User auth from header
    const authHeader = req.headers.get("authorization") || "";
    const userToken = authHeader.replace("Bearer ", "");

    // Create client to extract user and check role
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: `Bearer ${userToken}` } },
    });

    // Service client for admin operations
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

    const body = (await req.json()) as RequestBody;

    if (body.action === "load") {
      // Anyone can load published data
      const { data: versionData } = await serviceClient
        .from("fda_data_versions")
        .select("id, version_number, updated_at")
        .eq("is_published", true)
        .order("version_number", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!versionData) {
        return new Response(
          JSON.stringify({ success: true, data: null, message: "No published data" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: rows } = await serviceClient
        .from("fda_data_rows")
        .select("payload")
        .eq("version_id", versionData.id);

      const drugs: DrugApproval[] = (rows || []).map((r) => r.payload as DrugApproval);

      return new Response(
        JSON.stringify({
          success: true,
          data: drugs,
          version: versionData.version_number,
          updatedAt: versionData.updated_at,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (body.action === "save") {
      // Must be authenticated
      const {
        data: { user },
      } = await userClient.auth.getUser();

      if (!user) {
        return new Response(
          JSON.stringify({ success: false, error: "Not authenticated" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check admin role (use service client to bypass RLS)
      const { data: roleData } = await serviceClient
        .from("user_roles")
        .select("id")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();

      if (!roleData) {
        return new Response(
          JSON.stringify({ success: false, error: "Admin access required" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const drugsToSave = body.data;
      const fingerprint = createDataFingerprint(drugsToSave);

      // Create new version
      const { data: versionData, error: versionError } = await serviceClient
        .from("fda_data_versions")
        .insert({
          created_by: user.id,
          is_verified: true,
          is_published: true,
          data_fingerprint: fingerprint,
          notes: body.notes || null,
        })
        .select("id, version_number")
        .single();

      if (versionError) {
        console.error("Version insert error:", versionError);
        return new Response(
          JSON.stringify({ success: false, error: versionError.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Insert rows (batch)
      const rowsToInsert = drugsToSave.map((d) => ({
        version_id: versionData.id,
        payload: d,
      }));

      const { error: rowsError } = await serviceClient.from("fda_data_rows").insert(rowsToInsert);

      if (rowsError) {
        console.error("Rows insert error:", rowsError);
        return new Response(
          JSON.stringify({ success: false, error: rowsError.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          version: versionData.version_number,
          message: `Saved ${drugsToSave.length} rows as version ${versionData.version_number}`,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: false, error: "Invalid action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("persist-fda-data error:", err);
    return new Response(
      JSON.stringify({ success: false, error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
