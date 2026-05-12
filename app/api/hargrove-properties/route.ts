import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";
  const slug = searchParams.get("slug") ?? "";
  
  const hargroveUrl = "https://admin.haskerrealtygroup.com";

  try {
    if (slug) {
      // Fetch a specific property's details
      const res = await fetch(`${hargroveUrl}/api/v1/properties/${slug}/`);
      if (!res.ok) {
        return NextResponse.json({ error: "Failed to fetch property details" }, { status: res.status });
      }
      const data = await res.json();
      return NextResponse.json(data);
    } else {
      // Search properties
      const queryStr = q ? `search=${encodeURIComponent(q)}` : "page=1&page_size=20";
      const res = await fetch(`${hargroveUrl}/api/v1/properties/?${queryStr}`);
      if (!res.ok) {
        return NextResponse.json({ error: "Failed to fetch properties" }, { status: res.status });
      }
      const data = await res.json();
      return NextResponse.json(data);
    }
  } catch (err) {
    return NextResponse.json({ error: "Failed to reach Hargrove API" }, { status: 500 });
  }
}
