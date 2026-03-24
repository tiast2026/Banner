"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { TemplateEditor } from "@/components/TemplateEditor";

function EditTemplateContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  if (!id) {
    return <p className="p-8 text-center text-gray-500">テンプレートIDが指定されていません。</p>;
  }

  return <TemplateEditor templateId={id} />;
}

export default function EditTemplatePage() {
  return (
    <Suspense fallback={<p className="p-8 text-center">読み込み中...</p>}>
      <EditTemplateContent />
    </Suspense>
  );
}
