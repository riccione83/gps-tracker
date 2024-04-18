"use client"; //
import { API_URL } from "@/constrant";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

const ValidatePage = () => {
  const router = useRouter();
  const [validated, setValidated] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function handleValidation() {
      setIsLoading(true);

      fetch(API_URL + "/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: router.query.t,
        }),
      })
        .then(async (response) => {
          if (response.ok) {
            setIsLoading(false);
            setValidated(true);
            setError("");
          } else {
            const b = await response.json();
            setIsLoading(false);
            setValidated(false);
            setError(b.error);
          }
        })
        .catch((error) => {
          setIsLoading(false);
          setValidated(false);
          // setError(error);
        });
    }

    handleValidation();
  }, [router.query]);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "100vw",
        height: "100vh",
        background: "rgb(66,88,148)",
      }}
    >
      <div
        style={{
          border: "1px solid lightblue",
          padding: 40,
          borderRadius: 4,
          marginRight: 16,
          minHeight: "80px",
        }}
      >
        {isLoading && "Please wait, validation in progress..."}
        {validated && "Great! Your email has now been validated"}
        {error !== "" && error}
      </div>
    </div>
  );
};

export default ValidatePage;
