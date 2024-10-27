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
                  ? "bg-transparent underline underline-offset-8 hover:bg-transparent"
                  : "bg-transparent hover:bg-transparent"
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
                  ? "bg-transparent underline underline-offset-8 hover:bg-transparent"
                  : "bg-transparent hover:bg-transparent"
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
                  ? "bg-transparent underline underline-offset-8 hover:bg-transparent"
                  : "bg-transparent hover:bg-transparent"
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
