import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface EmailRequest {
  to: string;
  subject: string;
  dateRangeText: string;
  stats: {
    total: number;
    oncology: number;
    nonOncology: number;
    novelDrug: number;
    novelOncology: number;
    novelNonOncology: number;
    orphanDrug: number;
    origCount: number;
    supplCount: number;
  };
}

function generateEmailHtml(data: EmailRequest): string {
  const { stats, dateRangeText } = data;
  const now = new Date().toLocaleString("ko-KR", { timeZone: "Asia/Seoul" });

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background-color: #f9fafb;">
  <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding: 24px; color: white;">
      <h1 style="margin: 0; font-size: 24px; font-weight: 600;">US FDA 승인 현황</h1>
      <p style="margin: 8px 0 0 0; opacity: 0.9; font-size: 14px;">미국 FDA 전문의약품 승인 데이터 요약</p>
    </div>
    
    <!-- Date Range Section -->
    <div style="padding: 16px 24px; background: #eff6ff; border-bottom: 1px solid #bfdbfe;">
      <div style="display: flex; align-items: center; gap: 8px;">
        <span style="font-size: 16px;">📅</span>
        <span style="font-size: 14px; color: #1e40af; font-weight: 600;">승인일: ${dateRangeText}</span>
      </div>
    </div>
    
    <!-- Summary Stats - 2x2 Grid -->
    <div style="padding: 24px; background: #f8fafc; border-bottom: 1px solid #e5e7eb;">
      <h2 style="margin: 0 0 16px 0; font-size: 16px; color: #374151;">📊 요약 통계</h2>
      
      <!-- Row 1 -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 12px;">
        <tr>
          <td width="50%" style="padding-right: 6px;">
            <div style="background: white; padding: 16px; border-radius: 8px; text-align: center; border: 1px solid #e5e7eb;">
              <div style="font-size: 32px; font-weight: bold; color: #1e40af;">${stats.total}</div>
              <div style="font-size: 13px; color: #374151; font-weight: 500; margin-top: 4px;">전체 승인</div>
              <div style="font-size: 11px; color: #6b7280; margin-top: 4px;">최초승인: ${stats.origCount}건 / 변경승인: ${stats.supplCount}건</div>
            </div>
          </td>
          <td width="50%" style="padding-left: 6px;">
            <div style="background: white; padding: 16px; border-radius: 8px; text-align: center; border: 1px solid #e5e7eb;">
              <div style="font-size: 32px; font-weight: bold; color: #dc2626;">${stats.oncology}</div>
              <div style="font-size: 13px; color: #374151; font-weight: 500; margin-top: 4px;">항암제</div>
              <div style="font-size: 11px; color: #6b7280; margin-top: 4px;">비항암제: ${stats.nonOncology}건</div>
            </div>
          </td>
        </tr>
      </table>
      
      <!-- Row 2 -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td width="50%" style="padding-right: 6px;">
            <div style="background: white; padding: 16px; border-radius: 8px; text-align: center; border: 1px solid #e5e7eb;">
              <div style="font-size: 32px; font-weight: bold; color: #2563eb;">${stats.novelDrug}</div>
              <div style="font-size: 13px; color: #374151; font-weight: 500; margin-top: 4px;">신약 (Novel)</div>
              <div style="font-size: 11px; color: #6b7280; margin-top: 4px;">항암제 ${stats.novelOncology} / 비항암제 ${stats.novelNonOncology}</div>
            </div>
          </td>
          <td width="50%" style="padding-left: 6px;">
            <div style="background: white; padding: 16px; border-radius: 8px; text-align: center; border: 1px solid #e5e7eb;">
              <div style="font-size: 32px; font-weight: bold; color: #7c3aed;">${stats.orphanDrug}</div>
              <div style="font-size: 13px; color: #374151; font-weight: 500; margin-top: 4px;">희귀의약품</div>
              <div style="font-size: 11px; color: #6b7280; margin-top: 4px;">Orphan Drug</div>
            </div>
          </td>
        </tr>
      </table>
    </div>
    
    <!-- CTA Button -->
    <div style="padding: 40px 24px; text-align: center;">
      <a href="https://us-fda-approval.lovable.app" style="display: inline-block; background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); color: white; padding: 18px 48px; border-radius: 12px; text-decoration: none; font-size: 18px; font-weight: 600; box-shadow: 0 4px 14px rgba(59, 130, 246, 0.4);">
        📊 대시보드에서 상세 확인하기
      </a>
      <p style="margin: 16px 0 0 0; font-size: 13px; color: #6b7280;">클릭하여 필터링, 검색 등 상세 기능을 이용하세요</p>
    </div>
    
    <!-- Footer -->
    <div style="padding: 20px 24px; background: #f8fafc; border-top: 1px solid #e5e7eb; text-align: center;">
      <p style="margin: 0; font-size: 12px; color: #6b7280;">
        발송 시각: ${now}
      </p>
    </div>
  </div>
</body>
</html>
  `;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("RESEND_API_KEY");
    if (!apiKey) {
      throw new Error("RESEND_API_KEY is not configured. Please add it in Lovable Cloud secrets.");
    }

    const resend = new Resend(apiKey);
    const data: EmailRequest = await req.json();

    if (!data.to || !data.subject) {
      throw new Error("Missing required fields: to, subject");
    }

    const html = generateEmailHtml(data);

    const emailResponse = await resend.emails.send({
      from: "FDA Dashboard <onboarding@resend.dev>",
      to: [data.to],
      subject: data.subject,
      html,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
