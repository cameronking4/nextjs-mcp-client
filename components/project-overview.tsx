import NextLink from "next/link";
import Image from "next/image";

export const ProjectOverview = () => {
  return (
    <div className="flex flex-col items-center justify-end">
      <div className={`relative rounded-full flex items-center justify-center size-14`}>
          <Image src="/logo.png" alt="Logo" width={100} height={100} className="absolute transform scale-75" unoptimized quality={100} />
      </div>
      <h1 className="text-3xl font-semibold mb-4">MCP Workbench</h1>
      <p className="text-sm text-muted-foreground mb-4">
        An Open MCP client built with Next.js and Shadcn/UI
      </p>
    </div>
  );
};

const Link = ({
  children,
  href,
}: {
  children: React.ReactNode;
  href: string;
}) => {
  return (
    <NextLink
      target="_blank"
      className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 transition-colors duration-75"
      href={href}
    >
      {children}
    </NextLink>
  );
};
