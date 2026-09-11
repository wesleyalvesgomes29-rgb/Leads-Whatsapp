import { Lead } from '../types';

export function getBrasiliaDateParts(date = new Date()) {
  const formatter = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const get = (t: string) => parts.find((p) => p.type === t)?.value || '00';

  const year = get('year');
  const month = get('month');
  const day = get('day');
  const hour = get('hour');
  const minute = get('minute');
  const second = get('second');

  return {
    dateOnly: `${year}-${month}-${day}`,
    dateFormatted: `${day}/${month}/${year}`,
    timeOnly: `${hour}:${minute}:${second}`,
    full: `${year}-${month}-${day} ${hour}:${minute}:${second}`,
  };
}

export function generateInitialLeads(): Lead[] {
  const { dateOnly } = getBrasiliaDateParts();

  return [
    {
      id: 1,
      nome: 'Carlos Eduardo da Silva',
      hora: '09:14:20',
      timestamp: `${dateOnly} 09:14:20`,
      origem: 'Operações Internas - INC Empreendimentos',
      rawText: 'Olá equipe! Smart Link / Lead: Carlos Eduardo da Silva - Interesse Reserva Imperial',
      statusResposta: 'Integração ok',
    },
    {
      id: 2,
      nome: 'Mariana Costa Albuquerque',
      hora: '10:42:05',
      timestamp: `${dateOnly} 10:42:05`,
      origem: 'Operações Internas - INC Empreendimentos',
      rawText: 'Smart Link / Lead: Mariana Costa Albuquerque\nCampanha Instagram Stories',
      statusResposta: 'Integração ok',
    },
    {
      id: 3,
      nome: 'Felipe Mendes Gusmão',
      hora: '11:15:48',
      timestamp: `${dateOnly} 11:15:48`,
      origem: 'Operações Internas - INC Empreendimentos',
      rawText: 'Smart Link / Lead: Felipe Mendes Gusmão',
      statusResposta: 'Integração ok',
    },
    {
      id: 4,
      nome: 'Juliana Prado Vasconcelos',
      hora: '13:02:11',
      timestamp: `${dateOnly} 13:02:11`,
      origem: 'Operações Internas - INC Empreendimentos',
      rawText: 'Smart Link / Lead: Juliana Prado Vasconcelos - Loteamento Terras Altas',
      statusResposta: 'Integração ok',
    },
    {
      id: 5,
      nome: 'Rodrigo Henrique Bittencourt',
      hora: '14:38:52',
      timestamp: `${dateOnly} 14:38:52`,
      origem: 'Operações Internas - INC Empreendimentos',
      rawText: 'Smart Link / Lead: Rodrigo Henrique Bittencourt',
      statusResposta: 'Integração ok',
    },
  ];
}
