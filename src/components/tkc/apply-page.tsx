import * as React from 'react'
import { z } from 'zod'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { parseSongOption, parseSongTitle } from '@/content/swiss-song-pool'
import { t } from '@/text'
import { ChevronDown, Download } from 'lucide-react'
import { toast } from 'sonner'
import { useRegister, useSite, useSongPools } from '@/lib/api'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { FadeIn } from '@/components/tkc/guide-shared'
import { PageHero } from '@/components/tkc/layout'
import { REGISTER_LIMITS as L } from '../../../shared/register-limits'

declare global {
  interface Window {
    turnstile?: {
      render: (
        element: HTMLElement,
        options: {
          sitekey: string
          callback: (token: string) => void
          'expired-callback'?: () => void
          'error-callback'?: () => void
        }
      ) => string
      remove: (widgetId: string) => void
      reset?: (widgetId?: string) => void
    }
  }
}

type SiteData = {
  applyOpen?: boolean
}

type SongPoolEntry = {
  title: string
  difficulty: string
  level: number | null
}

type SongPoolsData = {
  arcadeSwiss?: SongPoolEntry[]
}

type RegisterResponse = {
  receiptId?: string | number
}

type RegisterPayload = {
  division: 'console' | 'arcade'
  website?: string
  turnstileToken?: string
  name: string
  phone: string
  email: string
  nickname: string
  namcoId: string
  videoLink?: string
  dohirobaNo?: string
  qualifierRegion?: string
  offlineSongs?: string[]
  spectator: boolean
  isMinor: boolean
  consentLink?: string
  privacyAgree: boolean
}

const LABEL_CLOSED = t('apply.closed')

const REGIONS = [
  { value: 'seoul', label: t('apply.region.seoul') },
  { value: 'daejeon', label: t('apply.region.daejeon') },
  { value: 'gwangju', label: t('apply.region.gwangju') },
  { value: 'busan', label: t('apply.region.busan') },
] as const

const CONSENT_PDF_URL = '/docs/consent-form.pdf'

const v = {
  divisionRequired: t('apply.validation.divisionRequired'),
  nameRequired: t('apply.validation.nameRequired'),
  phoneRequired: t('apply.validation.phoneRequired'),
  emailRequired: t('apply.validation.emailRequired'),
  emailInvalid: t('apply.validation.emailInvalid'),
  nicknameRequired: t('apply.validation.nicknameRequired'),
  namcoIdRequired: t('apply.validation.namcoIdRequired'),
  videoLinkRequired: t('apply.validation.videoLinkRequired'),
  dohirobaNoRequired: t('apply.validation.dohirobaNoRequired'),
  qualifierRegionRequired: t('apply.validation.qualifierRegionRequired'),
  offlineSongsRequired: t('apply.validation.offlineSongsRequired'),
  consentRequired: t('apply.validation.consentRequired'),
  privacyRequired: t('apply.validation.privacyRequired'),
}

const formSchema = z
  .object({
    division: z.enum(['console', 'arcade'], {
      error: (iss) =>
        iss.input === undefined ? v.divisionRequired : undefined,
    }),
    website: z.string().max(L.website).optional(),
    turnstileToken: z.string().max(L.turnstileToken).optional(),
    name: z.string().min(1, { message: v.nameRequired }).max(L.name),
    phone: z.string().min(1, { message: v.phoneRequired }).max(L.phone),
    email: z
      .string()
      .min(1, { message: v.emailRequired })
      .email({ message: v.emailInvalid })
      .max(L.email),
    nickname: z
      .string()
      .min(1, { message: v.nicknameRequired })
      .max(L.nickname),
    namcoId: z.string().min(1, { message: v.namcoIdRequired }).max(L.namcoId),
    // Console only
    videoLink: z.string().max(L.videoLink).optional(),
    // Arcade only
    dohirobaNo: z.string().max(L.dohirobaNo).optional(),
    qualifierRegion: z.string().max(L.qualifierRegion).optional(),
    offlineSong1: z.string().max(L.offlineSong).optional(),
    offlineSong2: z.string().max(L.offlineSong).optional(),
    offlineSong3: z.string().max(L.offlineSong).optional(),
    offlineSong4: z.string().max(L.offlineSong).optional(),
    // Common checkboxes
    spectator: z.boolean(),
    isMinor: z.boolean(),
    consentLink: z.string().max(L.consentLink).optional(),
    privacyAgree: z.boolean().refine((val) => val, {
      message: v.privacyRequired,
    }),
  })
  .superRefine((data, ctx) => {
    // Console: videoLink required
    if (data.division === 'console' && !data.videoLink?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['videoLink'],
        message: v.videoLinkRequired,
      })
    }

    // Arcade: dohirobaNo, qualifierRegion, offlineSongs required
    if (data.division === 'arcade') {
      if (!data.dohirobaNo?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['dohirobaNo'],
          message: v.dohirobaNoRequired,
        })
      }
      if (!data.qualifierRegion?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['qualifierRegion'],
          message: v.qualifierRegionRequired,
        })
      }
      const songs = [
        data.offlineSong1,
        data.offlineSong2,
        data.offlineSong3,
        data.offlineSong4,
      ]
      if (songs.some((s) => !s?.trim())) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['offlineSong1'],
          message: v.offlineSongsRequired,
        })
      }
    }

    // Minor: consent link required
    if (data.isMinor && !data.consentLink?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['consentLink'],
        message: v.consentRequired,
      })
    }
  })

type ApplyFormValues = z.infer<typeof formSchema>

const defaultValues: ApplyFormValues = {
  division: 'console',
  website: '',
  turnstileToken: '',
  name: '',
  phone: '',
  email: '',
  nickname: '',
  namcoId: '',
  videoLink: '',
  dohirobaNo: '',
  qualifierRegion: '',
  offlineSong1: '',
  offlineSong2: '',
  offlineSong3: '',
  offlineSong4: '',
  spectator: false,
  isMinor: false,
  consentLink: '',
  privacyAgree: false,
}

/* ════════════════════════════════════════════════════════════════════ */
/*  Styled field components                                           */
/* ════════════════════════════════════════════════════════════════════ */

function FieldLabel({
  children,
  required,
}: {
  children: React.ReactNode
  required?: boolean
}) {
  return (
    <div className='mb-1.5 text-[14px] font-semibold text-white/90'>
      {children}
      {required && (
        <span className='ml-1.5 text-[11px] font-bold text-[#e74c3c]'>*</span>
      )}
    </div>
  )
}

function FieldHint({ children }: { children: React.ReactNode }) {
  return (
    <div className='mt-1.5 text-[13px] leading-[1.5] text-white/40'>
      {children}
    </div>
  )
}

function SectionDivider() {
  return <div className='my-7 h-px bg-[#1e1e1e]' />
}

function SectionLabel({ title, desc }: { title: string; desc?: string }) {
  return (
    <div className='mb-5'>
      <div className='text-[17px] font-bold break-keep text-white/90 sm:text-[18px]'>
        {title}
      </div>
      {desc && (
        <div className='mt-1 text-[13px] break-keep text-white/40 sm:text-[14px]'>
          {desc}
        </div>
      )}
    </div>
  )
}

const inputClass =
  'w-full rounded-[10px] border border-[#1e1e1e] bg-[#0e0e0e] px-4 py-3.5 text-[15px] text-white/90 outline-none transition-[border-color,box-shadow] placeholder:text-white/25 focus:border-[#e74c3c]/40 focus:shadow-[0_0_0_3px_rgba(231,76,60,0.08)] disabled:cursor-not-allowed disabled:opacity-50'

/* ════════════════════════════════════════════════════════════════════ */
/*  Main page                                                          */
/* ════════════════════════════════════════════════════════════════════ */

export function ApplyPage() {
  const { data, isError } = useSite<SiteData>()
  const { data: poolsData } = useSongPools<SongPoolsData>()
  const applyOpen = data?.applyOpen

  const songPool = React.useMemo(() => {
    const entries = poolsData?.arcadeSwiss ?? []
    return entries
      .filter(
        (e): e is SongPoolEntry & { level: number } =>
          e.level != null && (e.difficulty === 'oni' || e.difficulty === 'ura')
      )
      .map((e) => `${e.title}|${e.difficulty}|${e.level}`)
  }, [poolsData?.arcadeSwiss])
  const registerMutation = useRegister<RegisterResponse, RegisterPayload>()
  const [receiptId, setReceiptId] = React.useState<string | null>(null)
  const turnstileRef = React.useRef<HTMLDivElement | null>(null)
  const turnstileWidgetId = React.useRef<string | null>(null)
  const [turnstileError, setTurnstileError] = React.useState<string | null>(
    null
  )
  const turnstileSiteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY || undefined

  const [privacyOpen, setPrivacyOpen] = React.useState(false)
  const [videoGuideOpen, setVideoGuideOpen] = React.useState(false)

  const form = useForm<ApplyFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  })
  const formRef = React.useRef(form)
  React.useEffect(() => {
    formRef.current = form
  }, [form])

  const division =
    useWatch({ control: form.control, name: 'division' }) ?? 'console'
  const isMinor = useWatch({ control: form.control, name: 'isMinor' }) ?? false
  const offlineSong1 = useWatch({ control: form.control, name: 'offlineSong1' })
  const offlineSong2 = useWatch({ control: form.control, name: 'offlineSong2' })
  const offlineSong3 = useWatch({ control: form.control, name: 'offlineSong3' })
  const offlineSong4 = useWatch({ control: form.control, name: 'offlineSong4' })

  const isConsole = division === 'console'
  const isArcade = division === 'arcade'
  const isSubmitting = registerMutation.isPending
  const isCompleted = receiptId !== null
  const isDisabled = isSubmitting || isCompleted
  const submitError = registerMutation.error ? t('apply.submitFailed') : null
  const turnstileFieldError = form.formState.errors.turnstileToken?.message

  const getAvailableSongs = (currentIndex: number) => {
    const selected = [offlineSong1, offlineSong2, offlineSong3, offlineSong4]
    const currentValue = selected[currentIndex]
    const usedTitles = selected
      .filter((s, i): s is string => i !== currentIndex && !!s)
      .map((s) => parseSongTitle(s))
    return songPool.filter(
      (song) =>
        song === currentValue || !usedTitles.includes(parseSongTitle(song))
    )
  }

  React.useEffect(() => {
    if (!turnstileSiteKey || !turnstileRef.current) return

    let cancelled = false
    const render = () => {
      if (cancelled || !turnstileRef.current) return
      if (window.turnstile?.render) {
        if (turnstileWidgetId.current) {
          window.turnstile.remove(turnstileWidgetId.current)
        }
        turnstileWidgetId.current = window.turnstile.render(
          turnstileRef.current,
          {
            sitekey: turnstileSiteKey,
            callback: (token: string) => {
              formRef.current.setValue('turnstileToken', token, {
                shouldValidate: true,
              })
              setTurnstileError(null)
            },
            'expired-callback': () => {
              formRef.current.setValue('turnstileToken', '', {
                shouldValidate: true,
              })
              window.turnstile?.reset?.(turnstileWidgetId.current ?? undefined)
              setTurnstileError('인증이 만료되었습니다. 다시 시도해주세요.')
            },
            'error-callback': () => {
              formRef.current.setValue('turnstileToken', '', {
                shouldValidate: true,
              })
              window.turnstile?.reset?.(turnstileWidgetId.current ?? undefined)
              setTurnstileError('인증을 완료할 수 없습니다. 다시 시도해주세요.')
            },
          }
        )
      }
    }

    const scriptId = 'cf-turnstile-script'
    const existing = document.getElementById(
      scriptId
    ) as HTMLScriptElement | null

    if (existing && window.turnstile) {
      render()
    } else {
      const script = existing ?? document.createElement('script')
      script.id = scriptId
      script.src =
        'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
      script.async = true
      script.defer = true
      script.onload = render
      script.onerror = () => {
        if (cancelled) return
        setTurnstileError(
          '보안 인증 스크립트를 불러오지 못했습니다. 광고 차단기/네트워크를 확인해주세요.'
        )
      }
      if (!existing) {
        document.body.appendChild(script)
      }
    }

    return () => {
      cancelled = true
      if (turnstileWidgetId.current && window.turnstile?.remove) {
        window.turnstile.remove(turnstileWidgetId.current)
        turnstileWidgetId.current = null
      }
    }
  }, [turnstileSiteKey])

  React.useEffect(() => {
    document.title = `${t('meta.siteName')} | ${t('apply.title')}`
  }, [])

  const onSubmit = async (values: ApplyFormValues) => {
    if (turnstileSiteKey && !values.turnstileToken?.trim()) {
      window.turnstile?.reset?.(turnstileWidgetId.current ?? undefined)
      form.setError('turnstileToken', {
        message: '보안 인증을 완료해주세요.',
      })
      return
    }

    const payload: RegisterPayload = {
      division: values.division,
      website: values.website,
      turnstileToken: values.turnstileToken,
      name: values.name,
      phone: values.phone,
      email: values.email,
      nickname: values.nickname,
      namcoId: values.namcoId,
      spectator: values.spectator,
      isMinor: values.isMinor,
      consentLink: values.consentLink?.trim() ?? '',
      privacyAgree: values.privacyAgree,
    }

    if (values.division === 'console') {
      payload.videoLink = values.videoLink?.trim() ?? ''
    } else {
      payload.dohirobaNo = values.dohirobaNo?.trim() ?? ''
      payload.qualifierRegion = values.qualifierRegion ?? ''
      payload.offlineSongs = [
        values.offlineSong1 ?? '',
        values.offlineSong2 ?? '',
        values.offlineSong3 ?? '',
        values.offlineSong4 ?? '',
      ]
    }

    try {
      const result = await registerMutation.mutateAsync(payload)
      setReceiptId(String(result?.receiptId ?? ''))
    } catch (error) {
      const rawMessage =
        error instanceof Error ? error.message : '신청 중 오류가 발생했습니다.'
      const message =
        rawMessage === 'Turnstile verification required'
          ? '보안 인증이 필요합니다. 인증을 완료한 뒤 다시 시도해주세요.'
          : rawMessage === 'Turnstile verification failed'
            ? '보안 인증 검증에 실패했습니다. 인증을 다시 진행해주세요.'
            : rawMessage
      toast.error('신청 실패', { description: message })
    }
  }

  if (applyOpen === false) {
    return (
      <div className='flex min-h-[40vh] items-center justify-center'>
        <p className='text-lg font-semibold'>{LABEL_CLOSED}</p>
      </div>
    )
  }

  /* ── step indicators ── */
  const STEPS = [
    { num: '01', label: '참가 정보' },
    { num: '02', label: isConsole ? '영상 제출' : '예선 정보' },
    { num: '03', label: '동의 및 확인' },
  ]

  return (
    <div className='w-full'>
      <PageHero
        badge='REGISTRATION'
        title={t('apply.title')}
        subtitle='TKC 2026 참가 신청'
        accentColor='#e74c3c'
        gradientTo='#f5a623'
      />

      {isError && (
        <p className='mb-4 text-sm text-[#e74c3c]'>{t('apply.failedStatus')}</p>
      )}

      {/* ── Form Card ── */}
      <FadeIn delay={300}>
        <div className='mb-10 overflow-hidden rounded-[20px] border border-[#1e1e1e] bg-[#111]'>
          {/* Step indicator */}
          <div className='flex border-b border-[#1e1e1e]'>
            {STEPS.map((step, i) => (
              <div
                key={step.num}
                className={`relative flex-1 py-4 text-center text-[14px] font-semibold ${
                  i < STEPS.length - 1 ? 'border-r border-[#1e1e1e]' : ''
                } text-white/90`}
              >
                <span className='mr-1.5 font-mono text-[11px] font-semibold text-[#e74c3c]'>
                  {step.num}
                </span>
                <span className='text-[13px] break-keep sm:text-[14px]'>
                  {step.label}
                </span>
              </div>
            ))}
          </div>

          {/* Form body */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <div className='p-7 sm:p-9'>
                {/* Honeypot */}
                <input
                  type='text'
                  tabIndex={-1}
                  autoComplete='off'
                  className='sr-only'
                  aria-hidden='true'
                  {...form.register('website')}
                />
                <input type='hidden' {...form.register('turnstileToken')} />

                {/* Turnstile */}
                {turnstileSiteKey ? (
                  <div className='mb-6 space-y-2'>
                    <div ref={turnstileRef} />
                    {turnstileError ? (
                      <p className='text-xs text-[#e74c3c]'>{turnstileError}</p>
                    ) : null}
                    {turnstileFieldError ? (
                      <p className='text-xs text-[#e74c3c]'>
                        {turnstileFieldError}
                      </p>
                    ) : null}
                  </div>
                ) : null}

                <fieldset disabled={isDisabled} className='space-y-0'>
                  {/* ═══ SECTION 1: 부문 선택 ═══ */}
                  <SectionLabel
                    title='부문 선택'
                    desc='참가할 부문을 선택해 주세요.'
                  />

                  <FormField
                    control={form.control}
                    name='division'
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <div className='grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3'>
                            {(
                              [
                                {
                                  value: 'console' as const,
                                  label: '콘솔',
                                  sub: '쿵딱! 원더풀 페스티벌',
                                },
                                {
                                  value: 'arcade' as const,
                                  label: '아케이드',
                                  sub: '니지이로 ver.',
                                },
                              ] as const
                            ).map((opt) => {
                              const active = field.value === opt.value
                              return (
                                <label
                                  key={opt.value}
                                  className={`flex cursor-pointer items-center gap-3 rounded-[10px] border p-3.5 transition-all sm:p-4 ${
                                    active
                                      ? 'border-[#e74c3c] bg-[#e74c3c]/[0.04]'
                                      : 'border-[#1e1e1e] bg-[#0e0e0e] hover:border-[#2a2a2a]'
                                  }`}
                                >
                                  <input
                                    type='radio'
                                    className='sr-only'
                                    name='division'
                                    value={opt.value}
                                    checked={active}
                                    onChange={() => field.onChange(opt.value)}
                                  />
                                  <span
                                    className={`flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                                      active
                                        ? 'border-[#e74c3c]'
                                        : 'border-[#2a2a2a]'
                                    }`}
                                  >
                                    {active && (
                                      <span className='size-2 rounded-full bg-[#e74c3c]' />
                                    )}
                                  </span>
                                  <div>
                                    <div className='text-[15px] font-semibold text-white/90'>
                                      {opt.label}
                                    </div>
                                    <div className='text-[12px] text-white/40'>
                                      {opt.sub}
                                    </div>
                                  </div>
                                </label>
                              )
                            })}
                          </div>
                        </FormControl>
                        <FormMessage className='mt-2 text-xs text-[#e74c3c]' />
                      </FormItem>
                    )}
                  />

                  <SectionDivider />

                  {/* ═══ SECTION 1b: 참가자 정보 ═══ */}
                  <SectionLabel
                    title='참가자 정보'
                    desc='정확한 정보를 입력해 주세요.'
                  />

                  <div className='space-y-4'>
                    {/* Name + Nickname */}
                    <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
                      <FormField
                        control={form.control}
                        name='name'
                        render={({ field }) => (
                          <FormItem>
                            <FieldLabel required>
                              {t('apply.field.name')}
                            </FieldLabel>
                            <FormControl>
                              <input
                                className={inputClass}
                                placeholder={t('apply.placeholder.name')}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage className='mt-1.5 text-xs text-[#e74c3c]' />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name='nickname'
                        render={({ field }) => (
                          <FormItem>
                            <FieldLabel required>
                              {t('apply.field.nickname')}
                            </FieldLabel>
                            <FormControl>
                              <input
                                className={inputClass}
                                placeholder={t('apply.placeholder.nickname')}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage className='mt-1.5 text-xs text-[#e74c3c]' />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Phone + Email */}
                    <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
                      <FormField
                        control={form.control}
                        name='phone'
                        render={({ field }) => (
                          <FormItem>
                            <FieldLabel required>
                              {t('apply.field.phone')}
                            </FieldLabel>
                            <FormControl>
                              <input
                                type='tel'
                                inputMode='tel'
                                autoComplete='tel'
                                className={inputClass}
                                placeholder={t('apply.placeholder.phone')}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage className='mt-1.5 text-xs text-[#e74c3c]' />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name='email'
                        render={({ field }) => (
                          <FormItem>
                            <FieldLabel required>
                              {t('apply.field.email')}
                            </FieldLabel>
                            <FormControl>
                              <input
                                type='email'
                                autoComplete='email'
                                className={inputClass}
                                placeholder={t('apply.placeholder.email')}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage className='mt-1.5 text-xs text-[#e74c3c]' />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Namco ID */}
                    <FormField
                      control={form.control}
                      name='namcoId'
                      render={({ field }) => (
                        <FormItem>
                          <FieldLabel required>
                            {t('apply.field.namcoId')}
                          </FieldLabel>
                          <FormControl>
                            <input
                              autoComplete='off'
                              className={inputClass}
                              placeholder={t('apply.placeholder.namcoId')}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage className='mt-1.5 text-xs text-[#e74c3c]' />
                        </FormItem>
                      )}
                    />
                  </div>

                  <SectionDivider />

                  {/* ═══ SECTION 2: Console → Video / Arcade → Songs ═══ */}
                  {isConsole && (
                    <>
                      <SectionLabel
                        title='동영상 링크'
                        desc='본인의 플레이 영상을 유튜브에 일부공개로 업로드하고 링크를 입력해 주세요.'
                      />

                      <FormField
                        control={form.control}
                        name='videoLink'
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <input
                                type='url'
                                className={inputClass}
                                placeholder={t('apply.placeholder.videoLink')}
                                {...field}
                              />
                            </FormControl>
                            <FieldHint>
                              <button
                                type='button'
                                onClick={() =>
                                  setVideoGuideOpen(!videoGuideOpen)
                                }
                                className='inline-flex items-center gap-1 text-[#e74c3c]/70 transition-colors hover:text-[#e74c3c]'
                              >
                                <ChevronDown
                                  className={`size-3.5 transition-transform ${videoGuideOpen ? 'rotate-180' : ''}`}
                                />
                                {t('apply.field.videoLinkGuideTitle')}
                              </button>
                            </FieldHint>
                            <FormMessage className='mt-1.5 text-xs text-[#e74c3c]' />
                          </FormItem>
                        )}
                      />

                      {videoGuideOpen && (
                        <div className='mt-3 rounded-[10px] border border-[#1e1e1e] bg-[#0e0e0e] p-4'>
                          <p className='text-[13px] leading-[1.7] whitespace-pre-line text-white/40'>
                            {t('apply.field.videoLinkGuide')}
                          </p>
                        </div>
                      )}
                    </>
                  )}

                  {isArcade && (
                    <>
                      <SectionLabel
                        title='아케이드 예선 정보'
                        desc='동더 광장 북번호, 예선 차수, 오프라인 예선곡을 입력해 주세요.'
                      />

                      <div className='space-y-4'>
                        <FormField
                          control={form.control}
                          name='dohirobaNo'
                          render={({ field }) => (
                            <FormItem>
                              <FieldLabel required>
                                {t('apply.field.dohirobaNo')}
                              </FieldLabel>
                              <FormControl>
                                <input
                                  inputMode='numeric'
                                  autoComplete='off'
                                  className={inputClass}
                                  placeholder={t(
                                    'apply.placeholder.dohirobaNo'
                                  )}
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage className='mt-1.5 text-xs text-[#e74c3c]' />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name='qualifierRegion'
                          render={({ field }) => (
                            <FormItem>
                              <FieldLabel required>
                                {t('apply.field.qualifierRegion')}
                              </FieldLabel>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger
                                    className={`${inputClass} flex items-center justify-between`}
                                  >
                                    <SelectValue
                                      placeholder={t(
                                        'apply.validation.qualifierRegionRequired'
                                      )}
                                    />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {REGIONS.map((r) => (
                                    <SelectItem key={r.value} value={r.value}>
                                      {r.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage className='mt-1.5 text-xs text-[#e74c3c]' />
                            </FormItem>
                          )}
                        />

                        {/* Offline songs */}
                        <div>
                          <FieldLabel required>
                            {t('apply.field.offlineSongs')}
                          </FieldLabel>
                          <FieldHint>
                            {t('apply.field.offlineSongsHelp')}
                          </FieldHint>
                          {songPool.length === 0 ? (
                            <p className='mt-3 text-xs text-white/40'>
                              {t('apply.songPoolEmpty')}
                            </p>
                          ) : (
                            <div className='mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2'>
                              {(
                                [
                                  'offlineSong1',
                                  'offlineSong2',
                                  'offlineSong3',
                                  'offlineSong4',
                                ] as const
                              ).map((fieldName, index) => (
                                <FormField
                                  key={fieldName}
                                  control={form.control}
                                  name={fieldName}
                                  render={({ field }) => (
                                    <FormItem>
                                      <div className='mb-1 text-[12px] font-medium text-white/50'>
                                        {t('apply.field.offlineSongLabel')}{' '}
                                        {index + 1}
                                      </div>
                                      <Select
                                        onValueChange={field.onChange}
                                        value={field.value}
                                      >
                                        <FormControl>
                                          <SelectTrigger
                                            className={`${inputClass} flex items-center justify-between`}
                                          >
                                            <SelectValue
                                              placeholder={t(
                                                'apply.field.offlineSongPlaceholder'
                                              )}
                                            />
                                          </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                          {getAvailableSongs(index).map(
                                            (song) => (
                                              <SelectItem
                                                key={song}
                                                value={song}
                                              >
                                                {parseSongOption(song)?.label ??
                                                  song}
                                              </SelectItem>
                                            )
                                          )}
                                        </SelectContent>
                                      </Select>
                                      <FormMessage className='mt-1.5 text-xs text-[#e74c3c]' />
                                    </FormItem>
                                  )}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}

                  <SectionDivider />

                  {/* ═══ SECTION 3: 확인 및 동의 ═══ */}
                  <SectionLabel
                    title='확인 및 동의'
                    desc='아래 항목을 확인하고 동의해 주세요.'
                  />

                  <div className='space-y-2.5'>
                    {/* Spectator */}
                    <FormField
                      control={form.control}
                      name='spectator'
                      render={({ field }) => (
                        <FormItem>
                          <label
                            className={`flex cursor-pointer items-start gap-3.5 rounded-xl border p-4 transition-all sm:p-5 ${
                              field.value
                                ? 'border-[#e74c3c] bg-[#e74c3c]/[0.03]'
                                : 'border-[#1e1e1e] bg-[#0e0e0e] hover:border-[#2a2a2a]'
                            }`}
                          >
                            <FormControl>
                              <input
                                type='checkbox'
                                className='sr-only'
                                checked={field.value}
                                onChange={(e) =>
                                  field.onChange(e.target.checked)
                                }
                              />
                            </FormControl>
                            <span
                              className={`mt-0.5 flex size-[22px] shrink-0 items-center justify-center rounded-md border-2 transition-all ${
                                field.value
                                  ? 'border-[#e74c3c] bg-[#e74c3c]'
                                  : 'border-[#2a2a2a]'
                              }`}
                            >
                              {field.value && (
                                <svg
                                  viewBox='0 0 24 24'
                                  fill='none'
                                  stroke='#fff'
                                  strokeWidth={3}
                                  strokeLinecap='round'
                                  strokeLinejoin='round'
                                  className='size-3'
                                >
                                  <polyline points='20 6 9 17 4 12' />
                                </svg>
                              )}
                            </span>
                            <div>
                              <div className='text-[15px] font-semibold text-white/90'>
                                {t('apply.field.spectator')}
                              </div>
                              <div className='mt-0.5 text-[13px] leading-[1.5] text-white/40'>
                                {t('apply.field.spectatorHelp')}
                              </div>
                            </div>
                          </label>
                        </FormItem>
                      )}
                    />

                    {/* Minor */}
                    <FormField
                      control={form.control}
                      name='isMinor'
                      render={({ field }) => (
                        <FormItem>
                          <label
                            className={`flex cursor-pointer items-start gap-3.5 rounded-xl border p-4 transition-all sm:p-5 ${
                              field.value
                                ? 'border-[#e74c3c] bg-[#e74c3c]/[0.03]'
                                : 'border-[#1e1e1e] bg-[#0e0e0e] hover:border-[#2a2a2a]'
                            }`}
                          >
                            <FormControl>
                              <input
                                type='checkbox'
                                className='sr-only'
                                checked={field.value}
                                onChange={(e) =>
                                  field.onChange(e.target.checked)
                                }
                              />
                            </FormControl>
                            <span
                              className={`mt-0.5 flex size-[22px] shrink-0 items-center justify-center rounded-md border-2 transition-all ${
                                field.value
                                  ? 'border-[#e74c3c] bg-[#e74c3c]'
                                  : 'border-[#2a2a2a]'
                              }`}
                            >
                              {field.value && (
                                <svg
                                  viewBox='0 0 24 24'
                                  fill='none'
                                  stroke='#fff'
                                  strokeWidth={3}
                                  strokeLinecap='round'
                                  strokeLinejoin='round'
                                  className='size-3'
                                >
                                  <polyline points='20 6 9 17 4 12' />
                                </svg>
                              )}
                            </span>
                            <div>
                              <div className='text-[15px] font-semibold text-white/90'>
                                {t('apply.field.isMinor')}
                              </div>
                              <div className='mt-0.5 text-[13px] leading-[1.5] text-white/40'>
                                {t('apply.field.isMinorHelp')}
                              </div>
                            </div>
                          </label>
                        </FormItem>
                      )}
                    />

                    {/* Privacy */}
                    <FormField
                      control={form.control}
                      name='privacyAgree'
                      render={({ field }) => (
                        <FormItem>
                          <label
                            className={`flex cursor-pointer items-start gap-3.5 rounded-xl border p-4 transition-all sm:p-5 ${
                              field.value
                                ? 'border-[#e74c3c] bg-[#e74c3c]/[0.03]'
                                : 'border-[#1e1e1e] bg-[#0e0e0e] hover:border-[#2a2a2a]'
                            }`}
                          >
                            <FormControl>
                              <input
                                type='checkbox'
                                className='sr-only'
                                checked={field.value}
                                onChange={(e) =>
                                  field.onChange(e.target.checked)
                                }
                              />
                            </FormControl>
                            <span
                              className={`mt-0.5 flex size-[22px] shrink-0 items-center justify-center rounded-md border-2 transition-all ${
                                field.value
                                  ? 'border-[#e74c3c] bg-[#e74c3c]'
                                  : 'border-[#2a2a2a]'
                              }`}
                            >
                              {field.value && (
                                <svg
                                  viewBox='0 0 24 24'
                                  fill='none'
                                  stroke='#fff'
                                  strokeWidth={3}
                                  strokeLinecap='round'
                                  strokeLinejoin='round'
                                  className='size-3'
                                >
                                  <polyline points='20 6 9 17 4 12' />
                                </svg>
                              )}
                            </span>
                            <div className='min-w-0 flex-1'>
                              <div className='text-[15px] font-semibold text-white/90'>
                                {t('apply.field.privacy')}{' '}
                                <span className='text-[11px] font-bold text-[#e74c3c]'>
                                  *
                                </span>
                              </div>
                              <div className='mt-0.5 text-[13px] text-white/40'>
                                {t('apply.field.privacyHelp')}
                              </div>

                              {/* Privacy accordion */}
                              <div className='mt-2.5 border-t border-[#1e1e1e] pt-2.5'>
                                <button
                                  type='button'
                                  onClick={(e) => {
                                    e.preventDefault()
                                    setPrivacyOpen(!privacyOpen)
                                  }}
                                  className='flex items-center gap-1 text-[13px] text-white/40 transition-colors hover:text-white/60'
                                >
                                  <ChevronDown
                                    className={`size-3.5 transition-transform ${privacyOpen ? 'rotate-180' : ''}`}
                                  />
                                  개인정보 수집 및 이용 세부사항
                                </button>
                                {privacyOpen && (
                                  <div className='mt-2.5 text-[13px] leading-[1.7] text-white/40'>
                                    <strong className='text-white/70'>
                                      수집 항목:
                                    </strong>{' '}
                                    이름, 전화번호, 이메일, 남코 아이디, 동더
                                    네임
                                    <br />
                                    <strong className='text-white/70'>
                                      수집 목적:
                                    </strong>{' '}
                                    대회 참가 접수 및 운영, 결과 안내
                                    <br />
                                    <strong className='text-white/70'>
                                      보유 기간:
                                    </strong>{' '}
                                    대회 종료 후 3개월
                                    <br />
                                    <br />
                                    동의를 거부할 수 있으나, 거부 시 대회 참가가
                                    불가합니다.
                                  </div>
                                )}
                              </div>
                            </div>
                          </label>
                          <FormMessage className='mt-1.5 text-xs text-[#e74c3c]' />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Minor consent section */}
                  {isMinor && (
                    <div className='mt-5 space-y-3 rounded-xl border border-[#1e1e1e] bg-[#0e0e0e] p-5'>
                      <p className='text-[15px] font-semibold text-white/90'>
                        {t('apply.field.consentLink')}
                      </p>
                      <a
                        href={CONSENT_PDF_URL}
                        download
                        className='inline-flex items-center gap-2 rounded-[10px] border border-[#1e1e1e] bg-white/[0.03] px-4 py-2.5 text-[14px] font-medium text-white/70 transition-colors hover:border-[#2a2a2a] hover:bg-white/[0.06]'
                      >
                        <Download className='size-4' />
                        {t('apply.field.consentDownload')}
                      </a>
                      <FormField
                        control={form.control}
                        name='consentLink'
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <input
                                className={inputClass}
                                placeholder={t('apply.placeholder.consentLink')}
                                {...field}
                              />
                            </FormControl>
                            <FieldHint>
                              {t('apply.field.consentLinkHelp')}
                            </FieldHint>
                            <FormMessage className='mt-1.5 text-xs text-[#e74c3c]' />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}
                </fieldset>

                {/* Completed banner */}
                {isCompleted && (
                  <div className='mt-6 rounded-xl border border-[#4ecb71]/30 bg-[#4ecb71]/[0.06] p-5 text-center'>
                    <p className='text-[15px] font-bold text-white/90'>
                      {t('apply.completed')}
                    </p>
                    <p className='mt-1 text-[13px] text-white/55'>
                      {t('apply.receiptId')}
                    </p>
                    <p className='mt-2 font-mono text-2xl font-bold break-all text-white/90'>
                      {receiptId || t('common.none')}
                    </p>
                  </div>
                )}

                {submitError && (
                  <p className='mt-4 text-sm text-[#e74c3c]'>{submitError}</p>
                )}
              </div>

              {/* Submit bar */}
              <div className='flex flex-col items-center justify-between gap-4 border-t border-[#1e1e1e] px-7 py-6 sm:flex-row sm:px-9'>
                <div className='text-[13px] text-white/40'>
                  <span className='text-[#e74c3c]'>*</span> 표시는 필수 입력
                  항목입니다.
                </div>
                <button
                  type='submit'
                  disabled={isDisabled}
                  className='w-full shrink-0 cursor-pointer rounded-[10px] bg-[#e74c3c] px-10 py-3.5 text-[16px] font-bold text-white transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto'
                  style={{
                    boxShadow: '0 4px 24px rgba(231,76,60,0.25)',
                  }}
                >
                  {isSubmitting ? t('apply.submitting') : t('apply.submit')}
                </button>
              </div>
            </form>
          </Form>
        </div>
      </FadeIn>

      {/* ── Footer ── */}
      <footer className='border-t border-[#1e1e1e] py-10 text-center'>
        <p className='text-[14px] leading-[1.8] text-white/35'>
          TKC 2026 — 태고의 달인 코리아 챔피언십
          <br />
          주최: 타이코랩스 · 협력: BNEK
        </p>
      </footer>
    </div>
  )
}
