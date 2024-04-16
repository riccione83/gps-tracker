import { useAppDispatch } from "@/store/store";
import { setUserState } from "@/store/userSlice";
import { useRouter } from "next/router";
import { useEffect } from "react";

const LogoutPage = () => {
  const router = useRouter();
  // const { logout } = useAuth();
  const dispatch = useAppDispatch();
  useEffect(() => {
    // logout();
    dispatch(setUserState(undefined));
    router.push("/login");
  }, []);
  return <div>Loggin out</div>;
};

export default LogoutPage;
