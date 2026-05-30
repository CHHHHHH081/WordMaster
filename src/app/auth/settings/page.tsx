export const dynamic = "force-dynamic";

import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { logoutUser } from "@/lib/auth-actions";
import Link from "next/link";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">请先登录</p>
        <Link href="/auth/login" className="text-blue-600 hover:underline mt-2 inline-block">
          去登录
        </Link>
      </div>
    );
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.userId },
  });

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold mb-6">⚙️ 账号设置</h1>

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
        <div>
          <h2 className="font-bold text-lg mb-4">个人信息</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">用户名</span>
              <span className="font-medium">{dbUser?.username}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">邮箱</span>
              <span className="font-medium">{dbUser?.email}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-500">注册时间</span>
              <span className="font-medium">
                {dbUser?.createdAt
                  ? new Date(dbUser.createdAt).toLocaleDateString("zh-CN")
                  : "-"}
              </span>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-gray-100">
          <form action={logoutUser}>
            <button
              type="submit"
              className="w-full bg-red-50 text-red-600 border border-red-200 py-2.5 rounded-lg font-medium hover:bg-red-100 transition-colors text-sm"
            >
              退出登录
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
