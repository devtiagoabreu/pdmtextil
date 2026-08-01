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

declare module "lucide-react" {
  import type { FC, SVGProps, ForwardRefExoticComponent, RefAttributes } from "react"

  export interface IconProps extends Partial<SVGProps<SVGSVGElement>> {
    size?: string | number
    color?: string
    strokeWidth?: string | number
    absoluteStrokeWidth?: boolean
  }

  export type LucideIcon = ForwardRefExoticComponent<IconProps & RefAttributes<SVGSVGElement>>

  export const Activity: LucideIcon
  export const AlertCircle: LucideIcon
  export const AlertTriangle: LucideIcon
  export const AlignCenter: LucideIcon
  export const AlignJustify: LucideIcon
  export const AlignLeft: LucideIcon
  export const AlignRight: LucideIcon
  export const ArrowDown: LucideIcon
  export const ArrowLeft: LucideIcon
  export const ArrowRight: LucideIcon
  export const ArrowUp: LucideIcon
  export const ArrowUpDown: LucideIcon
  export const AtSign: LucideIcon
  export const BarChart3: LucideIcon
  export const Beaker: LucideIcon
  export const Bell: LucideIcon
  export const BellRing: LucideIcon
  export const Bold: LucideIcon
  export const BookMarked: LucideIcon
  export const BookOpen: LucideIcon
  export const Bot: LucideIcon
  export const Building2: LucideIcon
  export const Calculator: LucideIcon
  export const Calendar: LucideIcon
  export const CalendarCheck: LucideIcon
  export const CalendarClock: LucideIcon
  export const CalendarDays: LucideIcon
  export const CalendarRange: LucideIcon
  export const Camera: LucideIcon
  export const Check: LucideIcon
  export const CheckCheck: LucideIcon
  export const CheckCircle: LucideIcon
  export const CheckCircle2: LucideIcon
  export const CheckIcon: LucideIcon
  export const CheckSquare: LucideIcon
  export const ChevronDown: LucideIcon
  export const ChevronDownIcon: LucideIcon
  export const ChevronLeft: LucideIcon
  export const ChevronRight: LucideIcon
  export const ChevronRightIcon: LucideIcon
  export const ChevronUp: LucideIcon
  export const ChevronUpIcon: LucideIcon
  export const Circle: LucideIcon
  export const CircleCheckIcon: LucideIcon
  export const ClipboardCheck: LucideIcon
  export const ClipboardList: LucideIcon
  export const Clock: LucideIcon
  export const Cloud: LucideIcon
  export const Code: LucideIcon
  export const Columns: LucideIcon
  export const Copy: LucideIcon
  export const Database: LucideIcon
  export const DollarSign: LucideIcon
  export const Download: LucideIcon
  export const Droplets: LucideIcon
  export const Edit3: LucideIcon
  export const ExternalLink: LucideIcon
  export const Eye: LucideIcon
  export const EyeOff: LucideIcon
  export const Factory: LucideIcon
  export const File: LucideIcon
  export const FileCode2: LucideIcon
  export const FileDown: LucideIcon
  export const FileJson: LucideIcon
  export const FileSpreadsheet: LucideIcon
  export const FileText: LucideIcon
  export const Filter: LucideIcon
  export const FlaskConical: LucideIcon
  export const Folder: LucideIcon
  export const GitBranch: LucideIcon
  export const Globe: LucideIcon
  export const GraduationCap: LucideIcon
  export const GripVertical: LucideIcon
  export const Handshake: LucideIcon
  export const Hash: LucideIcon
  export const History: LucideIcon
  export const Home: LucideIcon
  export const ImageIcon: LucideIcon
  export const Inbox: LucideIcon
  export const Info: LucideIcon
  export const InfoIcon: LucideIcon
  export const Italic: LucideIcon
  export const Key: LucideIcon
  export const Layers: LucideIcon
  export const Layout: LucideIcon
  export const LayoutDashboard: LucideIcon
  export const LayoutGrid: LucideIcon
  export const Link: LucideIcon
  export const List: LucideIcon
  export const ListChecks: LucideIcon
  export const ListOrdered: LucideIcon
  export const Loader2: LucideIcon
  export const Loader2Icon: LucideIcon
  export const Lock: LucideIcon
  export const LogIn: LucideIcon
  export const LogOut: LucideIcon
  export const Mail: LucideIcon
  export const MapPin: LucideIcon
  export const Maximize2: LucideIcon
  export const Medal: LucideIcon
  export const Megaphone: LucideIcon
  export const Menu: LucideIcon
  export const MessageCircle: LucideIcon
  export const MessageSquare: LucideIcon
  export const Minimize2: LucideIcon
  export const Minus: LucideIcon
  export const Moon: LucideIcon
  export const MousePointerClick: LucideIcon
  export const Move3D: LucideIcon
  export const Navigation: LucideIcon
  export const OctagonXIcon: LucideIcon
  export const Package: LucideIcon
  export const Palette: LucideIcon
  export const PanelLeftClose: LucideIcon
  export const PanelLeftOpen: LucideIcon
  export const Paperclip: LucideIcon
  export const Pencil: LucideIcon
  export const PenTool: LucideIcon
  export const Phone: LucideIcon
  export const PieChart: LucideIcon
  export const Play: LucideIcon
  export const Plus: LucideIcon
  export const PlusCircle: LucideIcon
  export const Printer: LucideIcon
  export const RefreshCw: LucideIcon
  export const Repeat: LucideIcon
  export const RotateCw: LucideIcon
  export const Save: LucideIcon
  export const Scissors: LucideIcon
  export const Search: LucideIcon
  export const Send: LucideIcon
  export const Settings: LucideIcon
  export const Shield: LucideIcon
  export const ShieldCheck: LucideIcon
  export const ShoppingCart: LucideIcon
  export const Shuffle: LucideIcon
  export const SkipForward: LucideIcon
  export const Smartphone: LucideIcon
  export const SmilePlus: LucideIcon
  export const Star: LucideIcon
  export const StarOff: LucideIcon
  export const Strikethrough: LucideIcon
  export const Sun: LucideIcon
  export const Table: LucideIcon
  export const Tag: LucideIcon
  export const Target: LucideIcon
  export const Trash2: LucideIcon
  export const TrendingUp: LucideIcon
  export const TriangleAlertIcon: LucideIcon
  export const Trophy: LucideIcon
  export const Truck: LucideIcon
  export const Type: LucideIcon
  export const Underline: LucideIcon
  export const Undo2: LucideIcon
  export const Upload: LucideIcon
  export const User: LucideIcon
  export const UserCheck: LucideIcon
  export const UserCircle: LucideIcon
  export const UserPlus: LucideIcon
  export const Users: LucideIcon
  export const Video: LucideIcon
  export const Wrench: LucideIcon
  export const X: LucideIcon
  export const XCircle: LucideIcon
  export const XIcon: LucideIcon
  export const Zap: LucideIcon
}
