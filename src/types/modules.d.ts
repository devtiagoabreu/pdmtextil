declare module "react-hook-form" {
  export type UseFormProps<TFieldValues = Record<string, any>, TContext = any> = {
    mode?: "onBlur" | "onChange" | "onSubmit" | "onTouched" | "all"
    reValidateMode?: "onBlur" | "onChange" | "onSubmit"
    defaultValues?: any
    values?: any
    errors?: any
    resolver?: any
    context?: TContext
    criteriaMode?: "firstError" | "all"
    shouldFocusError?: boolean
    shouldUnregister?: boolean
    shouldUseNativeValidation?: boolean
    delayError?: number
  }

  export type FieldValues = Record<string, any>
  export type Control<TFieldValues = FieldValues> = any
  export type FieldErrors<TFieldValues = FieldValues> = any

  export type UseFormReturn<TFieldValues = FieldValues, TContext = any> = {
    register: (name: string, options?: any) => any
    unregister: (name: string | string[], options?: any) => void
    formState: {
      isDirty: boolean
      dirtyFields: any
      touchedFields: any
      isSubmitted: boolean
      isSubmitSuccessful: boolean
      isSubmitting: boolean
      isLoading: boolean
      submitCount: number
      isValid: boolean
      isValidating: boolean
      errors: Partial<Record<string, any>>
    }
    watch: {
      (): any
      (name: string): any
      (name: string[]): any
      (callback: (data: any) => void): { unsubscribe: () => void }
    }
    handleSubmit: (onValid: any, onInvalid?: any) => (e?: any) => Promise<any>
    reset: (values?: any, options?: any) => void
    setError: (name: string, error: any) => void
    clearErrors: (name?: string | string[]) => void
    setValue: (name: string, value: any, options?: any) => void
    trigger: (name?: string | string[]) => Promise<boolean>
    control: Control<TFieldValues>
    getValues: (name?: string | string[]) => any
    getFieldState: (name: string) => any
    resetField: (name: string, options?: any) => void
    setFocus: (name: string) => void
  }

  export function useForm<TFieldValues = FieldValues, TContext = any>(
    props?: UseFormProps<TFieldValues, TContext>
  ): UseFormReturn<TFieldValues, TContext>

  export interface ControllerField {
    onChange: (...event: any[]) => void
    onBlur: () => void
    value: any
    name: string
    ref: React.Ref<any>
  }
  export interface ControllerRenderProps extends ControllerField {}
  export interface ControllerFieldState {
    invalid: boolean
    isTouched: boolean
    isDirty: boolean
    error?: any
  }
  export interface UseControllerReturn {
    field: ControllerField
    fieldState: ControllerFieldState
    formState: any
  }
  export const Controller: React.FC<{
    name: string
    control?: any
    render: (data: { field: ControllerField; fieldState: ControllerFieldState; formState: any }) => React.ReactElement
    rules?: any
    defaultValue?: any
    shouldUnregister?: boolean
  }>
  export const useController: any
  export const useWatch: any
  export const useFormContext: any
  export const useFormState: any
  export const useFieldArray: any
  export const FormProvider: any
  export const appendErrors: any
}

declare module "next-auth" {
  import type { NextApiRequest, NextApiResponse } from "next"

  export interface Session {
    user: {
      id?: string | null
      name?: string | null
      email?: string | null
      image?: string | null
      role?: string | null
      id_empresa?: number | null
      id_representante?: number | null
    }
    expires: string
  }

  export interface DefaultUser {
    id: string
    name?: string | null
    email?: string | null
    image?: string | null
    role?: string | null
  }

  export interface Account {
    id: string
    provider: string
    type: string
    providerAccountId: string
    userId: string
  }

  export interface Profile {
    sub?: string
    name?: string
    email?: string
    image?: string
  }

  export interface DefaultSession extends Session {}
  export interface User extends DefaultUser {}

  export interface NextAuthOptions {
    providers: any[]
    adapter?: any
    secret?: string
    session?: any
    jwt?: any
    pages?: any
    callbacks?: any
    events?: any
    theme?: any
    debug?: boolean
    logger?: any
  }

  export function getServerSession(req?: any, res?: any, options?: any): Promise<Session | null>

  export default function NextAuth(options: NextAuthOptions): any
}

declare module "next-auth/react" {
  export function useSession<R extends boolean = false>(
    options?: { required?: R; onUnauthenticated?: () => void }
  ): {
    data: R extends true ? any : any
    status: "loading" | "authenticated" | "unauthenticated"
    update: (data?: any) => Promise<any>
  }
  export const SessionProvider: React.FC<{ children: React.ReactNode; session?: any }>
  export const signIn: (provider?: string, options?: any) => Promise<any>
  export const signOut: (options?: any) => Promise<any>
  export const getCsrfToken: (options?: any) => Promise<string>
  export const getProviders: () => Promise<Record<string, any>>
  export const getSession: (options?: any) => Promise<any>
}

declare module "drizzle-orm" {
  export type AnyColumn = { name: string; table: { [key: string]: any } }
  export type SQL = { sql: string; params: any[]; toSQL: () => SQL; as: (alias: string) => SQLWrapper; mapWith: (fn: any) => SQLWrapper }
  export type SQLWrapper = { toSQL: () => SQL; as: (alias: string) => SQLWrapper; mapWith: (fn: any) => SQLWrapper }
  export type SelectedFields<T extends Record<string, any> = Record<string, any>> = T
  
  export function eq(a: AnyColumn | SQLWrapper, b: any): SQLWrapper
  export function and(...conditions: (SQLWrapper | undefined)[]): SQLWrapper | undefined
  export function or(...conditions: (SQLWrapper | undefined)[]): SQLWrapper | undefined
  export function ne(a: AnyColumn | SQLWrapper, b: any): SQLWrapper
  export function gt(a: AnyColumn | SQLWrapper, b: any): SQLWrapper
  export function gte(a: AnyColumn | SQLWrapper, b: any): SQLWrapper
  export function lt(a: AnyColumn | SQLWrapper, b: any): SQLWrapper
  export function lte(a: AnyColumn | SQLWrapper, b: any): SQLWrapper
  export function inArray(a: AnyColumn | SQLWrapper, b: any[]): SQLWrapper
  export function notInArray(a: AnyColumn | SQLWrapper, b: any[]): SQLWrapper
  export function isNull(a: AnyColumn | SQLWrapper): SQLWrapper
  export function isNotNull(a: AnyColumn | SQLWrapper): SQLWrapper
  export function like(a: AnyColumn | SQLWrapper, b: string): SQLWrapper
  export function ilike(a: AnyColumn | SQLWrapper, b: string): SQLWrapper
  export function asc(a: AnyColumn | SQLWrapper): SQLWrapper
  export function desc(a: AnyColumn | SQLWrapper): SQLWrapper
  export function count(): SQLWrapper
  export function sum(a: AnyColumn | SQLWrapper): SQLWrapper
  export function avg(a: AnyColumn | SQLWrapper): SQLWrapper
  export function min(a: AnyColumn | SQLWrapper): SQLWrapper
  export function max(a: AnyColumn | SQLWrapper): SQLWrapper
  export function sql<T = any>(strings: TemplateStringsArray, ...params: any[]): SQLWrapper
  export namespace sql {
    function join(values: any[], separator?: any): SQLWrapper
    function identifier(value: any): SQLWrapper
    function raw(value: any): SQLWrapper
  }
  export function alias(table: any, alias: string): any
  export type InferModel<T extends { $inferSelect: any; $inferInsert: any }> = T["$inferSelect"]
  export type InferInsertModel<T extends { $inferInsert: any }> = T["$inferInsert"]
}

declare module "next-auth/middleware" {
  export function withAuth(
    handler: any,
    options?: { callbacks?: any; pages?: any; secret?: string }
  ): any
}

declare module "next-auth/providers/credentials" {
  const CredentialsProvider: any
  export default CredentialsProvider
}

declare module "next-auth/providers/google" {
  const GoogleProvider: any
  export default GoogleProvider
}

declare module "drizzle-orm/pg-core" {
  export function alias(table: any, alias: string): any
  export function pgTable(name: string, columns: Record<string, any>, extraConfig?: any): any
  export const serial: any
  export const integer: any
  export const text: any
  export const timestamp: any
  export const varchar: any
  export const boolean: any
  export function jsonb(name: string, config?: any): { $type<T>(): any; default(v: any): any; notNull(): any }
  export function json(name: string, config?: any): { $type<T>(): any; default(v: any): any; notNull(): any }
  export const numeric: any
  export const doublePrecision: any
  export const date: any
  export const foreignKey: any
  export const index: any
  export const uniqueIndex: any
  export const unique: any
}

declare module "drizzle-orm/postgres-js" {
  export function drizzle(client: any, config?: { schema?: Record<string, any> }): any
}

