import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface EmailItem {
  approvalDate: string;
  brandName: string;
  activeIngredient: string;
  indicationFull: string;
  isOncology: boolean;
  isNovelDrug: boolean;
  isBiosimilar: boolean;
}

interface EmailRequest {
  to: string;
  subject: string;
  stats: {
    total: number;
    oncology: number;
    novelDrug: number;
    biosimilar: number;
    orphanDrug: number;
  };
  items: EmailItem[];
  totalCount: number;
}

function generateEmailHtml(data: EmailRequest): string {
  const { stats, items, totalCount } = data;
  const now = new Date().toLocaleString("ko-KR", { timeZone: "Asia/Seoul" });

  const itemRows = items
    .map(
      (item) => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-size: 14px;">${item.approvalDate}</td>
        <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-size: 14px;">
          <strong>${item.brandName}</strong>
          ${item.isOncology ? '<span style="background: #fef2f2; color: #dc2626; padding: 2px 6px; border-radius: 4px; font-size: 12px; margin-left: 4px;">항암</span>' : ""}
          ${item.isNovelDrug ? '<span style="background: #eff6ff; color: #2563eb; padding: 2px 6px; border-radius: 4px; font-size: 12px; margin-left: 4px;">신약</span>' : ""}
          ${item.isBiosimilar ? '<span style="background: #f0fdf4; color: #16a34a; padding: 2px 6px; border-radius: 4px; font-size: 12px; margin-left: 4px;">바이오시밀러</span>' : ""}
        </td>
        <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-size: 14px; color: #6b7280;">${item.indicationFull}</td>
      </tr>
    `
    )
    .join("");

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background-color: #f9fafb;">
  <div style="max-width: 700px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding: 24px; color: white;">
      <h1 style="margin: 0; font-size: 24px; font-weight: 600;">US FDA 승인 현황</h1>
      <p style="margin: 8px 0 0 0; opacity: 0.9; font-size: 14px;">미국 FDA 전문의약품 승인 데이터 요약</p>
    </div>
    
    <!-- Summary Stats -->
    <div style="padding: 24px; background: #f8fafc; border-bottom: 1px solid #e5e7eb;">
      <h2 style="margin: 0 0 16px 0; font-size: 16px; color: #374151;">📊 요약 통계</h2>
      <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px;">
        <div style="background: white; padding: 12px; border-radius: 8px; text-align: center; border: 1px solid #e5e7eb;">
          <div style="font-size: 24px; font-weight: bold; color: #1e40af;">${stats.total}</div>
          <div style="font-size: 12px; color: #6b7280;">전체</div>
        </div>
        <div style="background: white; padding: 12px; border-radius: 8px; text-align: center; border: 1px solid #e5e7eb;">
          <div style="font-size: 24px; font-weight: bold; color: #dc2626;">${stats.oncology}</div>
          <div style="font-size: 12px; color: #6b7280;">항암제</div>
        </div>
        <div style="background: white; padding: 12px; border-radius: 8px; text-align: center; border: 1px solid #e5e7eb;">
          <div style="font-size: 24px; font-weight: bold; color: #2563eb;">${stats.novelDrug}</div>
          <div style="font-size: 12px; color: #6b7280;">신약</div>
        </div>
        <div style="background: white; padding: 12px; border-radius: 8px; text-align: center; border: 1px solid #e5e7eb;">
          <div style="font-size: 24px; font-weight: bold; color: #16a34a;">${stats.biosimilar}</div>
          <div style="font-size: 12px; color: #6b7280;">바이오시밀러</div>
        </div>
      </div>
    </div>
    
    <!-- Data Table -->
    <div style="padding: 24px;">
      <h2 style="margin: 0 0 16px 0; font-size: 16px; color: #374151;">📋 최근 승인 목록 (상위 ${items.length}건)</h2>
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="background: #f1f5f9;">
            <th style="padding: 10px 8px; text-align: left; font-size: 12px; font-weight: 600; color: #475569;">승인일</th>
            <th style="padding: 10px 8px; text-align: left; font-size: 12px; font-weight: 600; color: #475569;">브랜드명</th>
            <th style="padding: 10px 8px; text-align: left; font-size: 12px; font-weight: 600; color: #475569;">적응증</th>
          </tr>
        </thead>
        <tbody>
          ${itemRows}
        </tbody>
      </table>
      ${totalCount > 10 ? `<p style="margin-top: 16px; font-size: 13px; color: #6b7280; text-align: center;">외 ${totalCount - 10}건의 데이터가 있습니다.</p>` : ""}
    </div>
    
    <!-- Footer -->
    <div style="padding: 20px 24px; background: #f8fafc; border-top: 1px solid #e5e7eb; text-align: center;">
      <p style="margin: 0; font-size: 12px; color: #6b7280;">
        발송 시각: ${now} | 
        <a href="https://us-fda-approval.lovable.app" style="color: #3b82f6; text-decoration: none;">대시보드 바로가기</a>
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
      from: "Jisoo Kim <jisoo.kim@samyang.com>",
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
