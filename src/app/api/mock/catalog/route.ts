import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const catalog = {
  storeName: "Aurora Market",
  products: [
    {
      id: 1,
      title: "Nimbus Headphones",
      subtitle: "Adaptive noise cancelling",
      price: "$129",
      accent: "#6750A4",
      image: "",
    },
    {
      id: 2,
      title: "Lumen Desk Lamp",
      subtitle: "Matter + Thread ready",
      price: "$89",
      accent: "#006A6A",
      image: "",
    },
    {
      id: 3,
      title: "Field Notes Folio",
      subtitle: "Recycled leather cover",
      price: "$42",
      accent: "#8B5000",
      image: "",
    },
    {
      id: 4,
      title: "Orbit Charging Tray",
      subtitle: "15W Qi2, two devices",
      price: "$64",
      accent: "#005DB7",
      image: "",
    },
  ],
};

export async function GET() {
  return NextResponse.json(catalog, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "no-store",
    },
  });
}
