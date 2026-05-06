import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ValidationRequest {
  applicationNo: string;
  brandName: string;
  applicationType: string;
}

interface ValidationResult {
  applicationNo: string;
  brandName: string;
  isValid: boolean;
  fdaBrandNames: string[];
  fdaSponsor: string | null;
  error?: string;
}

const VALID_APP_TYPES = new Set(["NDA", "BLA"]);
const MAX_ITEMS = 100;
const MAX_BRAND_LEN = 200;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Require authenticated admin
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("authorization") || "";
    if (!authHeader.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
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
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);
    const { data: roleData } = await serviceClient
      .from("user_roles")
      .select("id")
      .eq("user_id", userData.user.id)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleData) {
      return new Response(
        JSON.stringify({ error: "Forbidden: admin only" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { items } = (await req.json()) as { items: ValidationRequest[] };

    if (!items || !Array.isArray(items)) {
      return new Response(
        JSON.stringify({ error: "Invalid request: items array required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (items.length === 0 || items.length > MAX_ITEMS) {
      return new Response(
        JSON.stringify({ error: `items length must be 1..${MAX_ITEMS}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const results: ValidationResult[] = [];

    for (const item of items) {
      // Validate per-item input
      if (
        !item ||
        typeof item.applicationNo !== "string" ||
        typeof item.brandName !== "string" ||
        typeof item.applicationType !== "string"
      ) {
        results.push({
          applicationNo: String(item?.applicationNo ?? ""),
          brandName: String(item?.brandName ?? ""),
          isValid: false,
          fdaBrandNames: [],
          fdaSponsor: null,
          error: "Invalid item shape",
        });
        continue;
      }
      const appType = item.applicationType.toUpperCase();
      if (!VALID_APP_TYPES.has(appType)) {
        results.push({
          applicationNo: item.applicationNo,
          brandName: item.brandName,
          isValid: false,
          fdaBrandNames: [],
          fdaSponsor: null,
          error: "Invalid applicationType (NDA or BLA only)",
        });
        continue;
      }
      if (!/^\d{1,10}$/.test(item.applicationNo)) {
        results.push({
          applicationNo: item.applicationNo,
          brandName: item.brandName,
          isValid: false,
          fdaBrandNames: [],
          fdaSponsor: null,
          error: "Invalid applicationNo (numeric only)",
        });
        continue;
      }
      if (item.brandName.length > MAX_BRAND_LEN) {
        results.push({
          applicationNo: item.applicationNo,
          brandName: item.brandName.slice(0, MAX_BRAND_LEN),
          isValid: false,
          fdaBrandNames: [],
          fdaSponsor: null,
          error: "brandName too long",
        });
        continue;
      }

      try {
        const search = encodeURIComponent(`application_number:"${appType}${item.applicationNo}"`);
        const fdaUrl = `https://api.fda.gov/drug/drugsfda.json?search=${search}&limit=1`;

        const response = await fetch(fdaUrl);

        if (!response.ok) {
          if (response.status === 404) {
            results.push({
              applicationNo: item.applicationNo,
              brandName: item.brandName,
              isValid: false,
              fdaBrandNames: [],
              fdaSponsor: null,
              error: "Application not found in FDA database",
            });
            continue;
          }
          throw new Error(`FDA API error: ${response.status}`);
        }

        const data = await response.json();

        if (!data.results || data.results.length === 0) {
          results.push({
            applicationNo: item.applicationNo,
            brandName: item.brandName,
            isValid: false,
            fdaBrandNames: [],
            fdaSponsor: null,
            error: "No results from FDA",
          });
          continue;
        }

        const fdaRecord = data.results[0];
        const fdaBrandNames: string[] = [];

        if (fdaRecord.products && Array.isArray(fdaRecord.products)) {
          for (const product of fdaRecord.products) {
            if (product.brand_name && !fdaBrandNames.includes(product.brand_name)) {
              fdaBrandNames.push(product.brand_name);
            }
          }
        }

        const normalizedBrandName = item.brandName.toUpperCase().replace(/[^A-Z0-9]/g, "");
        const isValid = fdaBrandNames.some(
          (name) => name.toUpperCase().replace(/[^A-Z0-9]/g, "") === normalizedBrandName
        );

        results.push({
          applicationNo: item.applicationNo,
          brandName: item.brandName,
          isValid,
          fdaBrandNames,
          fdaSponsor: fdaRecord.sponsor_name || null,
        });

        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (itemError) {
        console.error(`Error validating ${item.applicationNo}:`, itemError);
        results.push({
          applicationNo: item.applicationNo,
          brandName: item.brandName,
          isValid: false,
          fdaBrandNames: [],
          fdaSponsor: null,
          error: itemError instanceof Error ? itemError.message : "Unknown error",
        });
      }
    }

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in validate-fda-data:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
