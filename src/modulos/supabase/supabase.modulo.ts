import { Global, Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { SupabaseServicio } from "./supabase.servicio";

@Global()
@Module({
  imports: [ConfigModule],
  providers: [SupabaseServicio],
  exports: [SupabaseServicio],
})
export class SupabaseModulo {}
