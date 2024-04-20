import { afterAll, beforeEach, describe, expect, test } from "@jest/globals";
import request from "supertest";
import { App } from "supertest/types";
import { AppDataSource } from "../data-source";
import { server, serverPromise } from "../index";
import session from "supertest-session";

describe("Unit tests for login endpoint", () => {
  beforeEach(async () => {});

  afterAll(async () => {
    console.info("Closing connection");
    await AppDataSource.destroy();
    await server.close();
  });

  test("HEALTHZ endpoint", async () => {
    const server = await serverPromise;
    const response = await request(server as App).get("/healthz");
    expect(response.statusCode).toBe(200);
  });

  test("Negative test case: Invalid login credentials", async () => {
    const server = await serverPromise;
    const response = await request(server as App)
      .post("/login")
      .send({ email: "test@example.com", password: "invalidpassword" })
      .set("Content-Type", "application/json")
      .set("Accept", "application/json");

    expect(response.statusCode).toBe(401);
  });

  test("Positive test case: Login success", async () => {
    const server = await serverPromise;
    const response = await request(server as App)
      .post("/login")
      .send({ email: "r.riki@tiscali.it", password: "sabrina1009" })
      .set("Content-Type", "application/json")
      .set("Accept", "application/json");

    expect(response.statusCode).toBe(200);
  });

  test("Negative test case: Missing device in GPS data", async () => {
    let server = await serverPromise;
    const response = await request(server as App)
      .post("/login")
      .send({ email: "r.riki@tiscali.it", password: "sabrina1009" })
      .set("Content-Type", "application/json")
      .set("Accept", "application/json");

    expect(response.statusCode).toBe(200);
    // server = await serverPromise;
    const gpsResponse = await request(server as App)
      .post("/gps")
      .send({ latitude: 40.7128, longitude: -74.006, unsecure: true });
    expect(gpsResponse.statusCode).toBe(401);
    expect(gpsResponse.text).toBe("Malformed data");
  });

  test("Positive test case: Valid GPS data", async () => {
    const server = await serverPromise;
    const response = await request(server as App)
      .post("/gps")
      .send({
        latitude: 40.7128,
        longitude: -74.006,
        device: 1,
        unsecure: true,
      });
    expect(response.statusCode).toBe(200);
    expect(response.text).toBe("DEVICE_NOT_FOUND");
  });
});
