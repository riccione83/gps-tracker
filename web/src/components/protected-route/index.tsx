"use client";
import { useAppSelector } from "@/store/store";
import { userData } from "@/store/userSlice";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useSelector } from "react-redux";

export default function isAuth(Component: any) {
  return function IsAuth(props: any) {
    // const { isReady, reload } = useAuth();
    const u = useSelector(userData);
    const user = useAppSelector((state) => state.user?.user);
    // console.info("USER@", user, u);
    const router = useRouter();
    // useEffect(() => {
    //   if (!u) {
    //     // logout();
    //     return router.replace("/login");
    //   }
    // }, [u]);

    // console.info("HELLO!", u, user);
    if (!u) {
      return null;
    }

    return <Component {...props} />;
  };
}
