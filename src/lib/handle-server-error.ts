import { AxiosError } from 'axios'
import { toast } from 'sonner'
import { t } from '@/text'

export function handleServerError(error: unknown) {
  // eslint-disable-next-line no-console
  console.log(error)

  let errMsg = t('toast.generalError')

  if (
    error &&
    typeof error === 'object' &&
    'status' in error &&
    Number(error.status) === 204
  ) {
    errMsg = t('toast.contentNotFound')
  } else if (error instanceof AxiosError && error.response?.status === 204) {
    errMsg = t('toast.contentNotFound')
  }

  toast.error(errMsg)
}
