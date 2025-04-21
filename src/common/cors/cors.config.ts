import {CorsOptions} from "@nestjs/common/interfaces/external/cors-options.interface";
import {allowedOrigins} from "./allowed-origins";

export const corsConfig: CorsOptions = {
  origin: allowedOrigins,
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
  allowedHeaders: "Content-Type, Authorization",
  credentials: true
};
