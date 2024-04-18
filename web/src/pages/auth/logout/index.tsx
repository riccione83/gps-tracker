import { useAppDispatch } from "@/store/store";
import { setUserState } from "@/store/userSlice";
import { useRouter } from "next/router";
import { useEffect } from "react";

const LogoutPage = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  useEffect(() => {
    dispatch(setUserState(undefined));
    router.push("/auth/login");
  }, []);
  return <div>Loggin out</div>;
};

export default LogoutPage;
