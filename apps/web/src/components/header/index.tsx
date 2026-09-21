import Link from 'next/link';

/**
 * 站点顶部导航栏，展示品牌名称并提供返回首页的入口
 *
 * @returns 顶部导航栏节点
 */
function Header() {
  return (
    <header className="border-b">
      <div className="container mx-auto flex h-14 items-center px-4">
        <Link href="/" className="text-lg font-semibold">
          Tool-Craft
        </Link>
      </div>
    </header>
  );
}

export default Header;
