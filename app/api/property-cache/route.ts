import { NextRequest, NextResponse } from "next/server";
import { ensureDbConnection, getErrorMessage } from "@/lib/api";
import PropertyCache from "@/lib/models/PropertyCache";

export async function GET(request: NextRequest) {
  const dbError = await ensureDbConnection();
  if (dbError) return dbError;
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");
  const city = searchParams.get("city");

  try {
    if (url) {
      const cached = await PropertyCache.findOne({ url }).lean();
      if (!cached) return NextResponse.json({ cached: null });
      const ageMs = Date.now() - new Date(cached.cachedAt).getTime();
      const ageDays = Math.floor(ageMs / (1000 * 60 * 60 * 24));
      return NextResponse.json({ cached: cached.data, ageDays });
    }

    if (city) {
      const items = await PropertyCache.find({ city: city.toLowerCase() })
        .sort({ cachedAt: -1 })
        .limit(50)
        .lean();
      return NextResponse.json(items.map((i) => ({ url: i.url, data: i.data, cachedAt: i.cachedAt })));
    }

    return NextResponse.json({ error: "Provide ?url= or ?city=" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error, "Failed to load property cache.") }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const dbError = await ensureDbConnection();
  if (dbError) return dbError;
  const { url, data, city } = await request.json();
  if (!url || !data || !city) {
    return NextResponse.json({ error: "url, data, city required" }, { status: 400 });
  }
  try {
    await PropertyCache.findOneAndUpdate(
      { url },
      { $set: { data, city: city.toLowerCase(), cachedAt: new Date() } },
      { upsert: true }
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error, "Failed to update property cache.") }, { status: 500 });
  }
}
