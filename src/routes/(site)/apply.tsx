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

export const Route = createFileRoute('/(site)/apply')({
  component: ApplyPage,
})

type SiteData = {
  applyOpen?: boolean
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

const LABEL_CONSOLE = '\uCF58\uC194'
const LABEL_ARCADE = '\uC544\uCF00\uC774\uB4DC'
const LABEL_CLOSED = '\uC2E0\uCCAD \uB9C8\uAC10'
const LABEL_REQUIRED_PRIVACY =
  '\uAC1C\uC778\uC815\uBCF4 \uC218\uC9D1 \uBC0F \uC774\uC6A9\uC5D0 \uB3D9\uC758\uD574\uC57C \uD569\uB2C8\uB2E4.'
const LABEL_CONSENT_REQUIRED =
  '\uBBF8\uC131\uB144\uC790\uB294 \uBCF4\uD638\uC790 \uB3D9\uC758\uC11C \uB9C1\uD06C\uAC00 \uD544\uC218\uC785\uB2C8\uB2E4.'

const formSchema = z
  .object({
    division: z.enum(['console', 'arcade'], {
      error: (iss) =>
        iss.input === undefined ? 'Please select a division.' : undefined,
    }),
    name: z.string().min(1, 'Name is required.'),
    phone: z.string().min(1, 'Phone is required.'),
    email: z.email({
      error: (iss) => (iss.input === '' ? 'Email is required.' : undefined),
    }),
    nickname: z.string().min(1, 'Nickname is required.'),
    cardNo: z.string().min(1, 'Card number is required.'),
    dohirobaNo: z.string().optional(),
    spectator: z.boolean(),
    isMinor: z.boolean(),
    consentLink: z.string().optional(),
    privacyAgree: z
      .boolean()
      .refine((value) => value, { message: LABEL_REQUIRED_PRIVACY }),
  })
  .refine(
    (data) => !data.isMinor || Boolean(data.consentLink?.trim()),
    {
      message: LABEL_CONSENT_REQUIRED,
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
  const submitError =
    registerMutation.error instanceof Error
      ? registerMutation.error.message
      : null

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
          TKC2026
        </p>
        <h1 className='text-3xl font-bold tracking-tight sm:text-4xl'>
          Apply
        </h1>
        <p className='text-sm text-muted-foreground'>
          Submit your registration details for the competition.
        </p>
      </div>

      {isLoading && (
        <p className='text-sm text-muted-foreground'>
          Checking application status...
        </p>
      )}
      {isError && (
        <p className='text-sm text-destructive'>
          Failed to load application status.
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Registration Form</CardTitle>
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
                      <FormLabel>Division</FormLabel>
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
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input placeholder='Player Name' {...field} />
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
                        <FormLabel>Nickname</FormLabel>
                        <FormControl>
                          <Input placeholder='TKC Player' {...field} />
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
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <Input placeholder='010-0000-0000' {...field} />
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
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            type='email'
                            placeholder='player@example.com'
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
                        <FormLabel>Card Number</FormLabel>
                        <FormControl>
                          <Input placeholder='CARD-000000' {...field} />
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
                        <FormLabel>Dohiroba No. (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder='Optional' {...field} />
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
                      <FormItem className='flex items-start gap-3 rounded-lg border p-4'>
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className='space-y-1 leading-none'>
                          <FormLabel>Spectator</FormLabel>
                          <FormDescription>
                            Check if you will bring a spectator.
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name='isMinor'
                    render={({ field }) => (
                      <FormItem className='flex items-start gap-3 rounded-lg border p-4'>
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className='space-y-1 leading-none'>
                          <FormLabel>Minor</FormLabel>
                          <FormDescription>
                            Parental consent is required.
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name='privacyAgree'
                    render={({ field }) => (
                      <FormItem className='flex items-start gap-3 rounded-lg border p-4'>
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className='space-y-1 leading-none'>
                          <FormLabel>Privacy Agreement</FormLabel>
                          <FormDescription>
                            You must agree to the privacy policy.
                          </FormDescription>
                          <FormMessage />
                        </div>
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
                        <FormLabel>Consent Link</FormLabel>
                        <FormControl>
                          <Input
                            placeholder='https://...'
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Required if the applicant is a minor.
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
                <div className='rounded-lg border bg-muted/40 p-4'>
                  <p className='text-sm text-muted-foreground'>Receipt ID</p>
                  <p className='text-lg font-semibold'>
                    {receiptId || 'N/A'}
                  </p>
                </div>
              )}

              <Button type='submit' disabled={isDisabled}>
                {isSubmitting ? 'Submitting...' : 'Submit'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
