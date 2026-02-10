import * as React from 'react'
import { z } from 'zod'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createFileRoute } from '@tanstack/react-router'
import { parseSongOption, parseSongTitle } from '@/content/swiss-song-pool'
import { t } from '@/text'
import { ChevronDown, Download } from 'lucide-react'
import { toast } from 'sonner'
import { useRegister, useSite, useSongPools } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { GlassCard } from '@/components/tkc/glass-card'
import { PageHero, TkcSection } from '@/components/tkc/layout'

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
    }
  }
}

export const Route = createFileRoute('/(site)/apply')({
  component: ApplyPage,
})

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

const LABEL_CONSOLE = t('nav.console')
const LABEL_ARCADE = t('nav.arcade')
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
    website: z.string().optional(),
    turnstileToken: z.string().optional(),
    name: z.string().min(1, { message: v.nameRequired }),
    phone: z.string().min(1, { message: v.phoneRequired }),
    email: z
      .string()
      .min(1, { message: v.emailRequired })
      .email({ message: v.emailInvalid }),
    nickname: z.string().min(1, { message: v.nicknameRequired }),
    namcoId: z.string().min(1, { message: v.namcoIdRequired }),
    // Console only
    videoLink: z.string().optional(),
    // Arcade only
    dohirobaNo: z.string().optional(),
    qualifierRegion: z.string().optional(),
    offlineSong1: z.string().optional(),
    offlineSong2: z.string().optional(),
    offlineSong3: z.string().optional(),
    offlineSong4: z.string().optional(),
    // Common checkboxes
    spectator: z.boolean(),
    isMinor: z.boolean(),
    consentLink: z.string().optional(),
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

function ApplyPage() {
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

  const form = useForm<ApplyFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  })

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

  // Get available songs for each selector, filtering out songs with the same title already selected
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
              form.setValue('turnstileToken', token, { shouldValidate: true })
              setTurnstileError(null)
            },
            'expired-callback': () => {
              form.setValue('turnstileToken', '', { shouldValidate: true })
              setTurnstileError('인증이 만료되었습니다. 다시 시도해주세요.')
            },
            'error-callback': () => {
              form.setValue('turnstileToken', '', { shouldValidate: true })
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
  }, [form, turnstileSiteKey])

  React.useEffect(() => {
    document.title = `${t('meta.siteName')} | ${t('apply.title')}`
  }, [])

  const onSubmit = async (values: ApplyFormValues) => {
    if (turnstileSiteKey && !values.turnstileToken?.trim()) {
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
      const message =
        error instanceof Error ? error.message : '신청 중 오류가 발생했습니다.'
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

  return (
    <TkcSection>
      <PageHero badge='REGISTRATION' title={t('apply.title')} subtitle={t('apply.subtitle')} />

      {isError && (
        <p className='text-sm text-destructive'>{t('apply.failedStatus')}</p>
      )}

      <GlassCard>
        <CardHeader className='p-5 md:p-7'>
          <CardTitle className='text-xl text-white md:text-2xl'>
            {t('apply.formTitle')}
          </CardTitle>
        </CardHeader>
        <CardContent className='p-5 pt-0 md:p-7 md:pt-0'>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
              {/* Honeypot field (should remain empty). */}
              <input
                type='text'
                tabIndex={-1}
                autoComplete='off'
                className='sr-only'
                aria-hidden='true'
                {...form.register('website')}
              />
              {turnstileSiteKey ? (
                <div className='space-y-2'>
                  <div ref={turnstileRef} />
                  {turnstileError ? (
                    <p className='text-xs text-destructive'>{turnstileError}</p>
                  ) : null}
                  {turnstileFieldError ? (
                    <p className='text-xs text-destructive'>
                      {turnstileFieldError}
                    </p>
                  ) : null}
                </div>
              ) : null}
              <fieldset disabled={isDisabled} className='space-y-6'>
                {/* ── Division ── */}
                <FormField
                  control={form.control}
                  name='division'
                  render={({ field }) => (
                    <FormItem className='space-y-3'>
                      <FormLabel>{t('apply.field.division')}</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className='grid gap-3 md:grid-cols-2'
                        >
                          <FormItem className='flex items-center gap-2 rounded-md border p-3'>
                            <FormControl>
                              <RadioGroupItem value='console' />
                            </FormControl>
                            <FormLabel className='font-normal'>
                              {LABEL_CONSOLE}
                            </FormLabel>
                          </FormItem>
                          <FormItem className='flex items-center gap-2 rounded-md border p-3'>
                            <FormControl>
                              <RadioGroupItem value='arcade' />
                            </FormControl>
                            <FormLabel className='font-normal'>
                              {LABEL_ARCADE}
                            </FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage className='text-xs text-white/60' />
                    </FormItem>
                  )}
                />

                {/* ── Common Fields ── */}
                <div className='grid gap-4 md:grid-cols-2'>
                  <FormField
                    control={form.control}
                    name='name'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('apply.field.name')}</FormLabel>
                        <FormControl>
                          <Input
                            placeholder={t('apply.placeholder.name')}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className='text-xs text-white/60' />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name='nickname'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('apply.field.nickname')}</FormLabel>
                        <FormControl>
                          <Input
                            placeholder={t('apply.placeholder.nickname')}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className='text-xs text-white/60' />
                      </FormItem>
                    )}
                  />
                </div>

                <div className='grid gap-4 md:grid-cols-2'>
                  <FormField
                    control={form.control}
                    name='phone'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('apply.field.phone')}</FormLabel>
                        <FormControl>
                          <Input
                            type='tel'
                            inputMode='tel'
                            autoComplete='tel'
                            placeholder={t('apply.placeholder.phone')}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className='text-xs text-white/60' />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name='email'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('apply.field.email')}</FormLabel>
                        <FormControl>
                          <Input
                            type='email'
                            autoComplete='email'
                            placeholder={t('apply.placeholder.email')}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className='text-xs text-white/60' />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name='namcoId'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('apply.field.namcoId')}</FormLabel>
                      <FormControl>
                        <Input
                          autoComplete='off'
                          placeholder={t('apply.placeholder.namcoId')}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className='text-xs text-white/60' />
                    </FormItem>
                  )}
                />

                {/* ── Console Only: Video Link ── */}
                {isConsole && (
                  <div className='space-y-3'>
                    <FormField
                      control={form.control}
                      name='videoLink'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('apply.field.videoLink')}</FormLabel>
                          <FormControl>
                            <Input
                              type='url'
                              placeholder={t('apply.placeholder.videoLink')}
                              {...field}
                            />
                          </FormControl>
                          <FormDescription className='text-xs text-white/60'>
                            {t('apply.field.videoLinkHelp')}
                          </FormDescription>
                          <FormMessage className='text-xs text-white/60' />
                        </FormItem>
                      )}
                    />
                    <Collapsible>
                      <CollapsibleTrigger className='flex items-center gap-1 text-xs text-white/50 hover:text-white/80'>
                        <ChevronDown className='size-3.5' />
                        {t('apply.field.videoLinkGuideTitle')}
                      </CollapsibleTrigger>
                      <CollapsibleContent className='mt-2 rounded-lg border border-white/10 bg-white/5 p-3'>
                        <p className='text-xs leading-relaxed whitespace-pre-line text-white/60'>
                          {t('apply.field.videoLinkGuide')}
                        </p>
                      </CollapsibleContent>
                    </Collapsible>
                  </div>
                )}

                {/* ── Arcade Only ── */}
                {isArcade && (
                  <>
                    <FormField
                      control={form.control}
                      name='dohirobaNo'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('apply.field.dohirobaNo')}</FormLabel>
                          <FormControl>
                            <Input
                              inputMode='numeric'
                              autoComplete='off'
                              placeholder={t('apply.placeholder.dohirobaNo')}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage className='text-xs text-white/60' />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name='qualifierRegion'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {t('apply.field.qualifierRegion')}
                          </FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className='w-full'>
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
                          <FormMessage className='text-xs text-white/60' />
                        </FormItem>
                      )}
                    />

                    {/* Offline Song Selection */}
                    <div className='space-y-3'>
                      <FormLabel>{t('apply.field.offlineSongs')}</FormLabel>
                      <FormDescription className='text-xs text-white/60'>
                        {t('apply.field.offlineSongsHelp')}
                      </FormDescription>
                      {songPool.length === 0 ? (
                        <p className='text-xs text-white/40'>
                          {t('apply.songPoolEmpty')}
                        </p>
                      ) : (
                        <div className='grid gap-3 md:grid-cols-2'>
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
                                  <FormLabel className='text-xs text-white/70'>
                                    {t('apply.field.offlineSongLabel')}{' '}
                                    {index + 1}
                                  </FormLabel>
                                  <Select
                                    onValueChange={field.onChange}
                                    value={field.value}
                                  >
                                    <FormControl>
                                      <SelectTrigger className='w-full'>
                                        <SelectValue
                                          placeholder={t(
                                            'apply.field.offlineSongPlaceholder'
                                          )}
                                        />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {getAvailableSongs(index).map((song) => (
                                        <SelectItem key={song} value={song}>
                                          {parseSongOption(song)?.label ?? song}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage className='text-xs text-white/60' />
                                </FormItem>
                              )}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}

                {/* ── Common Checkboxes ── */}
                <div className='space-y-4'>
                  {/* Spectator */}
                  <FormField
                    control={form.control}
                    name='spectator'
                    render={({ field }) => (
                      <FormItem className='flex items-start gap-4 rounded-lg border p-4 sm:p-5'>
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            className='mt-0.5 size-5'
                          />
                        </FormControl>
                        <div className='space-y-1 leading-none'>
                          <FormLabel className='text-base'>
                            {t('apply.field.spectator')}
                          </FormLabel>
                          <FormDescription className='text-xs text-white/60'>
                            {t('apply.field.spectatorHelp')}
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />

                  {/* Minor */}
                  <FormField
                    control={form.control}
                    name='isMinor'
                    render={({ field }) => (
                      <FormItem className='flex items-start gap-4 rounded-lg border p-4 sm:p-5'>
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            className='mt-0.5 size-5'
                          />
                        </FormControl>
                        <div className='space-y-1 leading-none'>
                          <FormLabel className='text-base'>
                            {t('apply.field.isMinor')}
                          </FormLabel>
                          <FormDescription className='text-xs text-white/60'>
                            {t('apply.field.isMinorHelp')}
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />

                  {/* Privacy */}
                  <div className='space-y-3'>
                    <FormField
                      control={form.control}
                      name='privacyAgree'
                      render={({ field }) => (
                        <FormItem className='flex items-start gap-4 rounded-lg border p-4 sm:p-5'>
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              className='mt-0.5 size-5'
                            />
                          </FormControl>
                          <div className='space-y-1 leading-none'>
                            <FormLabel className='text-base'>
                              {t('apply.field.privacy')}
                            </FormLabel>
                            <FormDescription className='text-xs text-white/60'>
                              {t('apply.field.privacyHelp')}
                            </FormDescription>
                          </div>
                          <FormMessage className='text-xs text-white/60' />
                        </FormItem>
                      )}
                    />
                    <Collapsible>
                      <CollapsibleTrigger className='flex items-center gap-1 text-xs text-white/50 hover:text-white/80'>
                        <ChevronDown className='size-3.5' />
                        개인정보 수집 및 이용 세부사항
                      </CollapsibleTrigger>
                      <CollapsibleContent className='mt-2 rounded-lg border border-white/10 bg-white/5 p-3'>
                        <p className='text-xs leading-relaxed whitespace-pre-line text-white/60'>
                          {t('apply.field.privacyDetail')}
                        </p>
                      </CollapsibleContent>
                    </Collapsible>
                  </div>
                </div>

                {/* Minor consent section */}
                {isMinor && (
                  <div className='space-y-3 rounded-lg border border-white/10 bg-white/5 p-4'>
                    <p className='text-sm font-medium text-white/90'>
                      {t('apply.field.consentLink')}
                    </p>
                    <a
                      href={CONSENT_PDF_URL}
                      download
                      className='inline-flex items-center gap-2 rounded-md border border-white/15 bg-white/5 px-3 py-2 text-sm text-white/80 transition-colors hover:bg-white/10'
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
                            <Input
                              placeholder={t('apply.placeholder.consentLink')}
                              {...field}
                            />
                          </FormControl>
                          <FormDescription className='text-xs text-white/60'>
                            {t('apply.field.consentLinkHelp')}
                          </FormDescription>
                          <FormMessage className='text-xs text-white/60' />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
              </fieldset>

              {submitError && (
                <p className='text-sm text-destructive'>{submitError}</p>
              )}

              {isCompleted && (
                <div className='rounded-lg border border-green-500/30 bg-green-500/10 p-4 text-center sm:text-left'>
                  <p className='text-sm font-semibold text-white'>
                    {t('apply.completed')}
                  </p>
                  <p className='text-sm text-white/60'>
                    {t('apply.receiptId')}
                  </p>
                  <p className='text-2xl font-semibold break-all sm:text-xl'>
                    {receiptId || t('common.none')}
                  </p>
                </div>
              )}

              <Button
                type='submit'
                disabled={isDisabled}
                className='w-full sm:w-auto'
              >
                {isSubmitting ? t('apply.submitting') : t('apply.submit')}
              </Button>
            </form>
          </Form>
        </CardContent>
      </GlassCard>
    </TkcSection>
  )
}
