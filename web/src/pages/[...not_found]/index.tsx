import Link from "next/link";
import { FaAngry } from "react-icons/fa";

export default function NotFound() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div>
        <FaAngry style={{ width: 100, height: 100, marginBottom: 16 }} />
      </div>
      <h1>Not found – 404!</h1>
      <div>
        <Link href="/">Go back to Home</Link>
      </div>
    </div>
  );
}
