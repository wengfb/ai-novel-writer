import { cookies } from "next/headers"
import type { Layout } from "react-resizable-panels"
import { HomeClient } from "./home-client"

export default async function Page() {
  let defaultLayout: Layout | undefined

  try {
    const cookieStore = await cookies()
    const raw = cookieStore.get("react-resizable-panels:studio-layout")?.value
    if (raw) {
      const parsed = JSON.parse(decodeURIComponent(raw))
      if (parsed && typeof parsed.left === "number" && typeof parsed.right === "number") {
        defaultLayout = parsed
      }
    }
  } catch { /* Cookie 读取失败则使用默认布局 */ }

  return <HomeClient defaultLayout={defaultLayout} />
}