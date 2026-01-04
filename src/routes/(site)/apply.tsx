import * as React from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createFileRoute } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
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
import { useRegister, useSite } from '@/lib/api'
import { t } from '@/text'

export const Route = createFileRoute('/(site)/apply')({
  component: ApplyPage,
})

type SiteData = {
  applyOpen?: boolean
  logoUrl?: string
}

type RegisterResponse = {
  receiptId?: string | number
}

type RegisterPayload = {
  division: 'console' | 'arcade'
  name: string
  phone: string
  email: string
  nickname: string
  cardNo: string
  dohirobaNo?: string
  spectator: boolean
  isMinor: boolean
  consentLink?: string
  privacyAgree: boolean
}

const LABEL_CONSOLE = t('nav.console')
const LABEL_ARCADE = t('nav.arcade')
const LABEL_CLOSED = t('apply.closed')
const validationMessages = {
  divisionRequired: t('apply.validation.divisionRequired'),
  nameRequired: t('apply.validation.nameRequired'),
  phoneRequired: t('apply.validation.phoneRequired'),
  emailRequired: t('apply.validation.emailRequired'),
  emailInvalid: t('apply.validation.emailInvalid'),
  nicknameRequired: t('apply.validation.nicknameRequired'),
  cardNoRequired: t('apply.validation.cardNoRequired'),
  consentRequired: t('apply.validation.consentRequired'),
  privacyRequired: t('apply.validation.privacyRequired'),
}

const formSchema = z
  .object({
    division: z.enum(['console', 'arcade'], {
      error: (iss) =>
        iss.input === undefined ? validationMessages.divisionRequired : undefined,
    }),
    name: z.string().min(1, { message: validationMessages.nameRequired }),
    phone: z.string().min(1, { message: validationMessages.phoneRequired }),
    email: z
      .string()
      .min(1, { message: validationMessages.emailRequired })
      .email({ message: validationMessages.emailInvalid }),
    nickname: z
      .string()
      .min(1, { message: validationMessages.nicknameRequired }),
    cardNo: z.string().min(1, { message: validationMessages.cardNoRequired }),
    dohirobaNo: z.string().optional(),
    spectator: z.boolean(),
    isMinor: z.boolean(),
    consentLink: z.string().optional(),
    privacyAgree: z
      .boolean()
      .refine((value) => value, { message: validationMessages.privacyRequired }),
  })
  .refine(
    (data) => !data.isMinor || Boolean(data.consentLink?.trim()),
    {
      message: validationMessages.consentRequired,
      path: ['consentLink'],
    }
  )

type ApplyFormValues = z.infer<typeof formSchema>

const defaultValues: ApplyFormValues = {
  division: 'console',
  name: '',
  phone: '',
  email: '',
  nickname: '',
  cardNo: '',
  dohirobaNo: '',
  spectator: false,
  isMinor: false,
  consentLink: '',
  privacyAgree: false,
}

function ApplyPage() {
  const { data, isLoading, isError } = useSite<SiteData>()
  const applyOpen = data?.applyOpen
  const registerMutation = useRegister<RegisterResponse, RegisterPayload>()
  const [receiptId, setReceiptId] = React.useState<string | null>(null)

  const form = useForm<ApplyFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  })

  const isMinor = form.watch('isMinor')
  const isSubmitting = registerMutation.isPending
  const isCompleted = receiptId !== null
  const isDisabled = isSubmitting || isCompleted
  const submitError = registerMutation.error ? t('apply.submitFailed') : null

  React.useEffect(() => {
    document.title = `${t('meta.siteName')} | ${t('apply.title')}`
  }, [])

  const onSubmit = async (values: ApplyFormValues) => {
    const payload: RegisterPayload = {
      ...values,
      consentLink: values.consentLink?.trim() ?? '',
      dohirobaNo: values.dohirobaNo?.trim() ?? '',
    }

    try {
      const result = await registerMutation.mutateAsync(payload)
      setReceiptId(String(result?.receiptId ?? ''))
    } catch {
      return
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
    <div className='space-y-6'>
      <div className='space-y-2'>
        <p className='text-xs uppercase tracking-[0.3em] text-muted-foreground'>
          {t('meta.siteName')}
        </p>
        <h1 className='text-3xl font-bold tracking-tight sm:text-4xl'>
          {t('apply.title')}
        </h1>
        <p className='text-sm text-muted-foreground'>
          {t('apply.subtitle')}
        </p>
      </div>

      {isLoading && (
        <p className='text-sm text-muted-foreground'>
          {t('apply.loadingStatus')}
        </p>
      )}
      {isError && (
        <p className='text-sm text-destructive'>
          {t('apply.failedStatus')}
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{t('apply.formTitle')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className='space-y-6'
            >
              <fieldset disabled={isDisabled} className='space-y-6'>
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
                          className='grid gap-3 sm:grid-cols-2'
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
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className='grid gap-4 sm:grid-cols-2'>
                  <FormField
                    control={form.control}
                    name='name'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('apply.field.name')}</FormLabel>
                        <FormControl>
                          <Input placeholder={t('apply.placeholder.name')} {...field} />
                        </FormControl>
                        <FormMessage />
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
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className='grid gap-4 sm:grid-cols-2'>
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
                        <FormMessage />
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
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className='grid gap-4 sm:grid-cols-2'>
                  <FormField
                    control={form.control}
                    name='cardNo'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('apply.field.cardNo')}</FormLabel>
                        <FormControl>
                          <Input
                            inputMode='numeric'
                            autoComplete='off'
                            placeholder={t('apply.placeholder.cardNo')}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
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
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className='space-y-4'>
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
                          <FormDescription>
                            {t('apply.field.spectatorHelp')}
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
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
                          <FormDescription>
                            {t('apply.field.isMinorHelp')}
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
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
                          <FormDescription>
                            {t('apply.field.privacyHelp')}
                          </FormDescription>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {isMinor && (
                  <FormField
                    control={form.control}
                    name='consentLink'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('apply.field.consentLink')}</FormLabel>
                        <FormControl>
                          <Input placeholder={t('apply.placeholder.consentLink')} {...field} />
                        </FormControl>
                        <FormDescription>
                          {t('apply.field.consentLinkHelp')}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </fieldset>

              {submitError && (
                <p className='text-sm text-destructive'>{submitError}</p>
              )}

              {isCompleted && (
                <div className='rounded-lg border bg-muted/40 p-4 text-center sm:text-left'>
                  <p className='text-sm font-semibold text-foreground'>
                    {t('apply.completed')}
                  </p>
                  <p className='text-sm text-muted-foreground'>
                    {t('apply.receiptId')}
                  </p>
                  <p className='text-2xl font-semibold break-all sm:text-xl'>
                    {receiptId || t('common.none')}
                  </p>
                </div>
              )}

              <Button type='submit' disabled={isDisabled} className='w-full sm:w-auto'>
                {isSubmitting ? t('apply.submitting') : t('apply.submit')}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
