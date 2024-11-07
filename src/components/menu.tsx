import Link from "next/link";
import { useRouter } from "next/router";

import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "~/components/ui/navigation-menu";

export default function Menu() {
  const router = useRouter();

  return (
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem>
          <Link href="/" legacyBehavior passHref>
            <NavigationMenuLink
              className={`${navigationMenuTriggerStyle()} ${
                router.pathname === "/"
                  ? "pointer-events-none text-[#09090b]"
                  : "bg-transparent"
              }`}
            >
              Home
            </NavigationMenuLink>
          </Link>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <Link href="/explore" legacyBehavior passHref>
            <NavigationMenuLink
              className={`${navigationMenuTriggerStyle()} ${
                router.pathname === "/explore"
                  ? "pointer-events-none text-[#09090b]"
                  : "bg-transparent"
              }`}
            >
              Explore
            </NavigationMenuLink>
          </Link>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <Link href="/about" legacyBehavior passHref>
            <NavigationMenuLink
              className={`${navigationMenuTriggerStyle()} ${
                router.pathname === "/about"
                  ? "pointer-events-none text-[#09090b]"
                  : "bg-transparent"
              }`}
            >
              About
            </NavigationMenuLink>
          </Link>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
}
