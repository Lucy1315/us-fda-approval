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

const MAX_ROWS = 5000;
const MAX_NOTE_LEN = 500;
const MAX_STRING_LEN = 2000;

function createDataFingerprint(data: DrugApproval[]): string {
  if (data.length === 0) return "empty";
  const first = data[0];
  const last = data[data.length - 1];
  const idsLen = data.reduce((acc, d) => acc + (d.applicationNo?.length || 0), 0);
  return `v2-${data.length}-${first?.applicationNo || ""}-${last?.applicationNo || ""}-${idsLen}`;
}

function isString(v: unknown): v is string {
  return typeof v === "string";
}

function validateDrug(d: unknown): d is DrugApproval {
  if (!d || typeof d !== "object") return false;
  const o = d as Record<string, unknown>;
  const requiredStrings = [
    "approvalMonth", "approvalDate", "ndaBlaNumber", "applicationNo",
    "applicationType", "brandName", "activeIngredient", "sponsor",
    "indicationFull", "therapeuticArea", "approvalType", "notes",
  ];
  for (const k of requiredStrings) {
    if (!isString(o[k])) return false;
    if ((o[k] as string).length > MAX_STRING_LEN) return false;
  }
  const requiredBooleans = ["isOncology", "isBiosimilar", "isNovelDrug", "isOrphanDrug"];
  for (const k of requiredBooleans) {
    if (typeof o[k] !== "boolean") return false;
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(o.approvalDate as string)) return false;
  if (!/^[A-Z0-9 _-]+$/i.test((o.applicationType as string).slice(0, 10))) return false;
  return true;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

    const body = (await req.json()) as RequestBody;

    if (body.action === "load") {
      // Public load - service client used to read published rows only
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
      // Require authenticated admin user
      const authHeader = req.headers.get("authorization") || "";
      if (!authHeader.startsWith("Bearer ")) {
        return new Response(
          JSON.stringify({ success: false, error: "Unauthorized" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const token = authHeader.replace("Bearer ", "");
      const userClient = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: `Bearer ${token}` } },
      });
      const { data: userData, error: userErr } = await userClient.auth.getUser();
      if (userErr || !userData?.user) {
        return new Response(
          JSON.stringify({ success: false, error: "Unauthorized" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const userId = userData.user.id;
      const { data: roleData } = await serviceClient
        .from("user_roles")
        .select("id")
        .eq("user_id", userId)
        .eq("role", "admin")
        .maybeSingle();
      if (!roleData) {
        return new Response(
          JSON.stringify({ success: false, error: "Forbidden: admin only" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Input validation
      if (!Array.isArray(body.data)) {
        return new Response(
          JSON.stringify({ success: false, error: "data must be an array" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (body.data.length === 0 || body.data.length > MAX_ROWS) {
        return new Response(
          JSON.stringify({ success: false, error: `data length must be 1..${MAX_ROWS}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      for (const d of body.data) {
        if (!validateDrug(d)) {
          return new Response(
            JSON.stringify({ success: false, error: "Invalid drug entry" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
      if (body.notes && (typeof body.notes !== "string" || body.notes.length > MAX_NOTE_LEN)) {
        return new Response(
          JSON.stringify({ success: false, error: "notes too long" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const drugsToSave = body.data;
      const fingerprint = createDataFingerprint(drugsToSave);

      const { data: versionData, error: versionError } = await serviceClient
        .from("fda_data_versions")
        .insert({
          created_by: userId,
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

      const CHUNK_SIZE = 100;
      const rowsToInsert = drugsToSave.map((d) => ({
        version_id: versionData.id,
        payload: d,
      }));

      const chunks: typeof rowsToInsert[] = [];
      for (let i = 0; i < rowsToInsert.length; i += CHUNK_SIZE) {
        chunks.push(rowsToInsert.slice(i, i + CHUNK_SIZE));
      }

      const insertResults = await Promise.all(
        chunks.map((chunk) => serviceClient.from("fda_data_rows").insert(chunk))
      );

      const rowsError = insertResults.find((r) => r.error)?.error;
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
