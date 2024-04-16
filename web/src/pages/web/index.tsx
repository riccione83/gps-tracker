"use client";
import isAuth from "@/components/protected-route";
import dynamic from "next/dynamic";
import React, { useEffect, useState } from "react";

const Home = dynamic(() => import("./home"), {
  ssr: false,
});

const Web = () => {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  return ready ? <Home /> : null;
};

export default isAuth(Web);
