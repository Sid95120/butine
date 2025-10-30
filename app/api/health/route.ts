import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const { data, error } = await supabase
    .from("products")
    .select("id,title,price_cents,variety,producer_id")
    .limit(50);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const items = (data ?? []).map(p => ({
    id: p.id,
    title: p.title,
    price: (p.price_cents ?? 0) / 100,
    variety: p.variety,
    producerId: p.producer_id,
  }));
  return NextResponse.json(items);
}
