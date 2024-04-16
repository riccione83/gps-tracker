import { ApolloClient, InMemoryCache } from "@apollo/client";
import { API_URL } from "./constrant";

const createApolloClient = () => {
  return new ApolloClient({
    uri: API_URL + "/api",
    cache: new InMemoryCache({}),
  });
};

export default createApolloClient;
