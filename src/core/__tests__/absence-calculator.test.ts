import { describe, it, expect } from 'vitest';
import {
  parseHoursPerClass,
  calculateAbsenceRisk,
} from '../domain/utils/absence-calculator';

describe('Absence Calculator - Regras de Faltas UnB (25%)', () => {
  describe('parseHoursPerClass - Identificação de duração da aula (1, 2 ou 4 horas)', () => {
    it('identifica aula dupla (2 horas) em código 35T45', () => {
      expect(parseHoursPerClass('35T45')).toBe(2);
      expect(parseHoursPerClass('35T45 (10/08/2026 - 14/12/2026)')).toBe(2);
    });

    it('identifica aula dupla (2 horas) em código 24M34', () => {
      expect(parseHoursPerClass('24M34')).toBe(2);
    });

    it('identifica aula dupla (2 horas) em código 246N12', () => {
      expect(parseHoursPerClass('246N12')).toBe(2);
    });

    it('identifica aula quádrupla (4 horas) em bloco de 4 períodos como 4M1234', () => {
      expect(parseHoursPerClass('4M1234')).toBe(4);
      expect(parseHoursPerClass('2T1234 (10/08/2026 - 14/12/2026)')).toBe(4);
    });

    it('identifica aula simples (1 hora) em código de 1 período como 6T1', () => {
      expect(parseHoursPerClass('6T1')).toBe(1);
      expect(parseHoursPerClass('2M1')).toBe(1);
    });

    it('retorna 2 como padrão para horários sem padrão ou vazios', () => {
      expect(parseHoursPerClass('')).toBe(2);
      expect(parseHoursPerClass(null)).toBe(2);
      expect(parseHoursPerClass(undefined)).toBe(2);
      expect(parseHoursPerClass('A combinar com o professor')).toBe(2);
    });
  });

  describe('calculateAbsenceRisk - Estimativa de aulas até reprovação', () => {
    it('calcula corretamente para aluno com 0 faltas em aula dupla (2h, máx 15)', () => {
      const result = calculateAbsenceRisk({
        absences: 0,
        maxAbsences: 15,
        schedule: '35T45',
      });

      expect(result.absences).toBe(0);
      expect(result.maxAbsences).toBe(15);
      expect(result.hoursPerClass).toBe(2);
      expect(result.remainingAbsences).toBe(15);
      expect(result.safeClassesToMiss).toBe(7); // 7 * 2 = 14 faltas permitidas
      expect(result.classesUntilReproval).toBe(8); // Se faltar 8 aulas (16h), reprova
      expect(result.isAtRisk).toBe(false);
      expect(result.isCritical).toBe(false);
      expect(result.isExceeded).toBe(false);
    });

    it('identifica alerta moderado quando restam 2 aulas para reprovação', () => {
      const result = calculateAbsenceRisk({
        absences: 12,
        maxAbsences: 15,
        schedule: '35T45',
      });

      expect(result.remainingAbsences).toBe(3);
      expect(result.safeClassesToMiss).toBe(1); // Pode faltar 1 aula (+2 = 14)
      expect(result.classesUntilReproval).toBe(2); // Se faltar 2 aulas (+4 = 16), reprova
      expect(result.isAtRisk).toBe(true);
      expect(result.isCritical).toBe(false);
      expect(result.isExceeded).toBe(false);
      expect(result.warningMessage).toContain('Restam apenas 2 aulas');
    });

    it('identifica alerta crítico quando resta apenas 1 aula para reprovação', () => {
      const result = calculateAbsenceRisk({
        absences: 14,
        maxAbsences: 15,
        schedule: '35T45',
      });

      expect(result.remainingAbsences).toBe(1);
      expect(result.safeClassesToMiss).toBe(0); // Não pode faltar nenhuma aula
      expect(result.classesUntilReproval).toBe(1); // Na próxima falta (14 + 2 = 16), reprova
      expect(result.isAtRisk).toBe(true);
      expect(result.isCritical).toBe(true);
      expect(result.isExceeded).toBe(false);
      expect(result.warningMessage).toContain('Resta apenas 1 aula');
    });

    it('identifica alerta crítico quando o aluno já atingiu exatamente o limite (15/15)', () => {
      const result = calculateAbsenceRisk({
        absences: 15,
        maxAbsences: 15,
        schedule: '35T45',
      });

      expect(result.remainingAbsences).toBe(0);
      expect(result.safeClassesToMiss).toBe(0);
      expect(result.classesUntilReproval).toBe(1); // Mais 1 aula e reprova
      expect(result.isAtRisk).toBe(true);
      expect(result.isCritical).toBe(true);
      expect(result.isExceeded).toBe(false);
    });

    it('identifica limite excedido (reprovado por faltas)', () => {
      const result = calculateAbsenceRisk({
        absences: 16,
        maxAbsences: 15,
        schedule: '35T45',
      });

      expect(result.isExceeded).toBe(true);
      expect(result.isAtRisk).toBe(true);
      expect(result.isCritical).toBe(true);
      expect(result.classesUntilReproval).toBe(0);
      expect(result.safeClassesToMiss).toBe(0);
      expect(result.warningMessage).toContain('Limite de 25% excedido');
    });

    it('calcula corretamente para aula quádrupla (4h por encontro)', () => {
      const result = calculateAbsenceRisk({
        absences: 8,
        maxAbsences: 15,
        schedule: '4M1234',
      });

      expect(result.hoursPerClass).toBe(4);
      expect(result.remainingAbsences).toBe(7);
      expect(result.safeClassesToMiss).toBe(1); // 1 aula de 4h -> 12 faltas <= 15
      expect(result.classesUntilReproval).toBe(2); // 2 aulas de 4h -> 16 faltas > 15
      expect(result.isAtRisk).toBe(true);
      expect(result.isCritical).toBe(false);
    });

    it('calcula corretamente para aula simples (1h por encontro)', () => {
      const result = calculateAbsenceRisk({
        absences: 5,
        maxAbsences: 7, // 25% de 30h ~ 7 faltas
        schedule: '6T1',
      });

      expect(result.hoursPerClass).toBe(1);
      expect(result.remainingAbsences).toBe(2);
      expect(result.safeClassesToMiss).toBe(2);
      expect(result.classesUntilReproval).toBe(3);
      expect(result.isAtRisk).toBe(false);
    });
  });
});
