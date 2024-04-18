"use client";
import { useAppSelector } from "@/store/store";
import { userData } from "@/store/userSlice";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useSelector } from "react-redux";

export default function isAuth(Component: any) {
  return function IsAuth(props: any) {
    const user = useAppSelector((state) => state.user?.user);
    const router = useRouter();
    useEffect(() => {
      if (!user) {
        return router.replace("/auth/logout");
      }
    }, [user]);

    return <Component {...props} />;
  };
}
