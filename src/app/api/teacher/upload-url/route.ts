import { NextResponse } from "next/server";
import { requireTeacherOrAdmin } from "@/lib/auth";
import { makeKey, getUploadUrl } from "@/lib/r2";

// Returns a presigned URL the browser uses to PUT the file directly to R2.
// This avoids sending the file through our serverless function (Vercel caps
// request bodies at 4.5MB), so large PDFs upload fine.
export async function POST(request: Request) {
  const auth = await requireTeacherOrAdmin();
  if (auth.error) return auth.error;

  const { fileName, contentType } = await request.json();
  if (!fileName) {
    return NextResponse.json({ error: "fileName required" }, { status: 400 });
  }
  if (contentType !== "application/pdf") {
    return NextResponse.json({ error: "Only PDF files allowed" }, { status: 400 });
  }

  const key = makeKey("teacher", fileName);
  const { uploadUrl, publicUrl } = await getUploadUrl(key, "application/pdf");

  return NextResponse.json({ uploadUrl, publicUrl });
}
