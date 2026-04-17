import { format, formatDistanceToNow } from 'date-fns'

export const formatDate     = (d: string | Date) => format(new Date(d), 'MMM d, yyyy')
export const formatDateTime = (d: string | Date) => format(new Date(d), 'MMM d, yyyy · h:mm a')
export const timeAgo        = (d: string | Date) => formatDistanceToNow(new Date(d), { addSuffix: true })
