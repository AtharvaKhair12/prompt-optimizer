import { handlers } from "@/lib/auth";

export const GET = (req: Request) => handlers.GET(req as any);
export const POST = (req: Request) => handlers.POST(req as any);
