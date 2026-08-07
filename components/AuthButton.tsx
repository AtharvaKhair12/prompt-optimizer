"use client";

import { signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogIn, LogOut, User } from "lucide-react";
import Link from "next/link";

export function AuthButton() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="h-8 w-8 animate-shimmer rounded-full" />
    );
  }

  if (session?.user) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full h-8 w-8 border border-border/30"
            >
              <Avatar className="h-7 w-7">
                <AvatarImage
                  src={session.user.image || undefined}
                  alt={session.user.name || "User avatar"}
                />
                <AvatarFallback className="bg-primary/20 text-primary text-xs uppercase">
                  {session.user.name?.charAt(0) || session.user.email?.charAt(0) || (
                    <User className="h-3.5 w-3.5" />
                  )}
                </AvatarFallback>
              </Avatar>
            </Button>
          }
        />
        <DropdownMenuContent align="end" className="glass w-56">
          <div className="px-2 py-1.5">
            <p className="text-sm font-medium">{session.user.name || "User"}</p>
            <p className="text-xs text-muted-foreground truncate">
              {session.user.email}
            </p>
          </div>
          <DropdownMenuSeparator className="opacity-30" />
          <DropdownMenuItem
            onClick={() => signOut({ callbackUrl: "/" })}
            className="text-destructive/80 focus:text-destructive cursor-pointer"
          >
            <LogOut className="mr-2 h-3.5 w-3.5" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <Link href="/login">
      <Button
        variant="outline"
        size="sm"
        className="gap-2 border-border/30 text-muted-foreground hover:text-foreground"
      >
        <LogIn className="h-3.5 w-3.5" />
        Sign in
      </Button>
    </Link>
  );
}
