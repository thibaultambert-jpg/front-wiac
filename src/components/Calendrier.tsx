"use client";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import frLocale from "@fullcalendar/core/locales/fr";
import { useRouter } from "next/navigation";

export type EvenementCalendrier = {
  id: string;
  title: string;
  start: string;
  end: string;
  url: string;
  color: string;
  complet: boolean;
};

export function Calendrier({ evenements, date }: { evenements: EvenementCalendrier[]; date?: string }) {
  const router = useRouter();
  return (
    <div className="card p-3 sm:p-4">
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin]}
        locale={frLocale}
        initialView="dayGridMonth"
        initialDate={date}
        headerToolbar={{ left: "prev,next today", center: "title", right: "dayGridMonth,timeGridWeek" }}
        height="auto"
        dayMaxEvents={3}
        firstDay={1}
        slotMinTime="08:00:00"
        slotMaxTime="21:30:00"
        events={evenements.map((e) => ({
          id: e.id,
          title: e.complet ? `${e.title} (complet)` : e.title,
          start: e.start,
          end: e.end,
          backgroundColor: e.color,
          textColor: "#fff",
          extendedProps: { href: e.url },
        }))}
        eventClick={(info) => {
          info.jsEvent.preventDefault();
          router.push(String(info.event.extendedProps.href));
        }}
      />
    </div>
  );
}
