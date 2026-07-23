import { google } from "googleapis"

function getCalendarClient(accessToken: string) {
  const auth = new google.auth.OAuth2()
  auth.setCredentials({ access_token: accessToken })
  return google.calendar({ version: "v3", auth })
}

export interface CalendarEventInput {
  summary: string
  description?: string
  startTime: string
  endTime?: string
  location?: string
}

export async function createCalendarEvent(accessToken: string, event: CalendarEventInput): Promise<string> {
  const calendar = getCalendarClient(accessToken)
  const startDateTime = new Date(event.startTime).toISOString()
  const endDateTime = event.endTime
    ? new Date(event.endTime).toISOString()
    : new Date(new Date(event.startTime).getTime() + 60 * 60 * 1000).toISOString()

  const res = await calendar.events.insert({
    calendarId: "primary",
    requestBody: {
      summary: event.summary,
      description: event.description || "",
      location: event.location || "",
      start: { dateTime: startDateTime },
      end: { dateTime: endDateTime },
    },
  })

  return res.data.id || ""
}

export async function updateCalendarEvent(accessToken: string, eventId: string, event: CalendarEventInput): Promise<void> {
  const calendar = getCalendarClient(accessToken)
  const startDateTime = new Date(event.startTime).toISOString()
  const endDateTime = event.endTime
    ? new Date(event.endTime).toISOString()
    : new Date(new Date(event.startTime).getTime() + 60 * 60 * 1000).toISOString()

  await calendar.events.update({
    calendarId: "primary",
    eventId,
    requestBody: {
      summary: event.summary,
      description: event.description || "",
      location: event.location || "",
      start: { dateTime: startDateTime },
      end: { dateTime: endDateTime },
    },
  })
}

export async function deleteCalendarEvent(accessToken: string, eventId: string): Promise<void> {
  const calendar = getCalendarClient(accessToken)
  await calendar.events.delete({
    calendarId: "primary",
    eventId,
  })
}
