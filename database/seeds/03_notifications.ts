import type { Knex } from 'knex';
import { startOfWeek, endOfWeek, addDays, subDays, addMonths, isSameWeek } from 'date-fns';
import { computeScheduledAt } from '../../src/utils/computeScheduledAt';

// Retorna a data com horário 12:00 UTC (= 09:00 BRT, Brasil não tem horário de verão)
const noon = (d: Date): Date =>
  new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 12, 0, 0));

// Extrai mês/dia da data em UTC (month/day do campo de recorrência da notificação)
const monthOf = (d: Date) => d.getUTCMonth() + 1;
const dayOf   = (d: Date) => d.getUTCDate();

// Computa as datas do grupo 1 de forma dinâmica para cobrir todos os estados do front:
//
//  userId | Membro            | Estado
//  -------|-------------------|------------------------------------
//    2    | Ana Silva         | esta semana — futuro
//    3    | Carlos Santos     | esta semana — passado
//    4    | Mariana Oliveira  | este mês — futuro (após a semana)
//    5    | Pedro Costa       | este ano — futuro (após o mês)
//    6    | Juliana Ferreira  | este ano — futuro (após o mês)
//    7    | Roberto Alves     | já foi (30 dias antes da semana)
//    8    | Fernanda Lima     | já foi (10 dias antes da semana)
function buildGroup1Dates(): Record<number, Date> {
  const today     = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekEnd   = endOfWeek(today, { weekStartsOn: 1 });

  // Esta semana passado: ontem se ainda cai nesta semana, senão segunda-feira
  const weekPast = isSameWeek(subDays(today, 1), today, { weekStartsOn: 1 })
    ? subDays(today, 1)
    : weekStart;

  // Esta semana futuro: amanhã se ainda cai nesta semana, senão domingo
  const weekFuture = isSameWeek(addDays(today, 1), today, { weekStartsOn: 1 })
    ? addDays(today, 1)
    : weekEnd;

  return {
    2: noon(weekFuture),               // Ana — esta semana, futuro
    3: noon(weekPast),                 // Carlos — esta semana, passado
    4: noon(addDays(weekEnd, 5)),      // Mariana — este mês, futuro
    5: noon(addMonths(today, 2)),      // Pedro — este ano, futuro
    6: noon(addMonths(today, 5)),      // Juliana — este ano, futuro
    7: noon(subDays(weekStart, 30)),   // Roberto — já foi
    8: noon(subDays(weekStart, 10)),   // Fernanda — já foi
  };
}

const g1Dates = buildGroup1Dates();

// month/day de cada membro é derivado das datas do grupo 1
// (grupos 2–4 usam computeScheduledAt com esses mesmos valores)
const members = [
  { userId: 2, name: 'Ana Silva',        month: monthOf(g1Dates[2]), day: dayOf(g1Dates[2]) },
  { userId: 3, name: 'Carlos Santos',    month: monthOf(g1Dates[3]), day: dayOf(g1Dates[3]) },
  { userId: 4, name: 'Mariana Oliveira', month: monthOf(g1Dates[4]), day: dayOf(g1Dates[4]) },
  { userId: 5, name: 'Pedro Costa',      month: monthOf(g1Dates[5]), day: dayOf(g1Dates[5]) },
  { userId: 6, name: 'Juliana Ferreira', month: monthOf(g1Dates[6]), day: dayOf(g1Dates[6]) },
  { userId: 7, name: 'Roberto Alves',    month: monthOf(g1Dates[7]), day: dayOf(g1Dates[7]) },
  { userId: 8, name: 'Fernanda Lima',    month: monthOf(g1Dates[8]), day: dayOf(g1Dates[8]) },
];

const groupMembers: Record<number, number[]> = {
  1: [2, 3, 4, 5, 6, 7, 8], // Enterprise
  2: [2, 3, 4, 5],           // Business
  3: [2, 7, 8],              // Pro
  4: [3, 6],                 // Starter
};

export async function seed(knex: Knex): Promise<void> {
  await knex('notification_logs').del();
  await knex('notifications').del();

  const TZ = 'America/Sao_Paulo';
  const notifications: object[] = [];
  let id = 1;

  // Mapeia userId → notificationId para as notificações do grupo 1
  const g1NotifIds: Record<number, number> = {};

  for (const [groupIdStr, userIds] of Object.entries(groupMembers)) {
    const groupId = Number(groupIdStr);
    for (const userId of userIds) {
      const member = members.find((m) => m.userId === userId)!;
      const scheduledAt =
        groupId === 1
          ? g1Dates[userId]
          : computeScheduledAt(member.month, member.day, TZ);

      if (groupId === 1) g1NotifIds[userId] = id;

      notifications.push({
        id,
        group_id:     groupId,
        created_by:   1,
        name:         `Aniversário de ${member.name}`,
        description:  `Parabéns ao membro ${member.name}!`,
        month:        member.month,
        day:          member.day,
        timezone:     TZ,
        scheduled_at: scheduledAt,
      });
      id++;
    }
  }

  await knex('notifications').insert(notifications);

  // Logs para as notificações passadas do grupo 1
  // (Roberto e Fernanda = antes da semana; Carlos = esta semana passado)
  await knex('notification_logs').insert([
    { notification_id: g1NotifIds[7], group_id: 1, sent_at: g1Dates[7], status: 'sent'   }, // Roberto
    { notification_id: g1NotifIds[8], group_id: 1, sent_at: g1Dates[8], status: 'sent'   }, // Fernanda
    { notification_id: g1NotifIds[3], group_id: 1, sent_at: g1Dates[3], status: 'failed', error: 'Destinatário inacessível' }, // Carlos
  ]);
}
