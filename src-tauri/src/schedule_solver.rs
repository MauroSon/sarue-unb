use crate::grade_scraper::ScrapedClass;
use serde::{Deserialize, Serialize};
use std::collections::{HashMap, HashSet};

#[derive(Debug, Clone, Serialize, Deserialize, specta::Type)]
pub struct ScheduleOption {
    pub id: String,
    pub classes: Vec<ScrapedClass>,
    pub has_conflict: bool,
    pub conflicts: Vec<String>,
    pub score: i32,
}

pub struct ScheduleSolver;

impl ScheduleSolver {
    /// Detecta conflitos de horário em uma lista de turmas
    pub fn find_conflicts(classes: &[ScrapedClass]) -> Vec<String> {
        let mut conflicts = Vec::new();
        let mut slot_map: HashMap<(u8, u32), &ScrapedClass> = HashMap::new();

        for class_item in classes {
            for slot in &class_item.schedule_slots {
                let key = (slot.day, slot.global_slot_index);
                if let Some(existing_class) = slot_map.get(&key) {
                    if existing_class.discipline_code != class_item.discipline_code {
                        let desc = format!(
                            "Conflito na {} ({}) entre {} (Turma {}) e {} (Turma {})",
                            slot.day_name,
                            slot.time_range,
                            existing_class.discipline_code,
                            existing_class.class_code,
                            class_item.discipline_code,
                            class_item.class_code
                        );
                        if !conflicts.contains(&desc) {
                            conflicts.push(desc);
                        }
                    }
                } else {
                    slot_map.insert(key, class_item);
                }
            }
        }

        conflicts
    }

    /// Verifica se uma combinação de turmas não possui sobreposições de horários
    pub fn is_valid_combination(classes: &[ScrapedClass]) -> bool {
        let mut occupied_slots: HashSet<(u8, u32)> = HashSet::new();

        for class_item in classes {
            for slot in &class_item.schedule_slots {
                let key = (slot.day, slot.global_slot_index);
                if occupied_slots.contains(&key) {
                    return false;
                }
                occupied_slots.insert(key);
            }
        }

        true
    }

    /// Calcula pontuação de preferência para ordenar combinações
    fn calculate_score(classes: &[ScrapedClass], preference_shift: Option<char>) -> i32 {
        let mut score = 100;

        for class_item in classes {
            for slot in &class_item.schedule_slots {
                if let Some(pref) = preference_shift {
                    if slot.shift == pref {
                        score += 15;
                    } else {
                        score -= 5;
                    }
                }

                // Prioriza horários que não sejam isolados
                score += match slot.shift {
                    'M' => 10,
                    'T' => 8,
                    'N' => 6,
                    _ => 0,
                };
            }
        }

        score
    }

    /// Gera todas as opções de grade viáveis sem colisão a partir das turmas candidatas
    pub fn solve(
        candidate_classes: Vec<ScrapedClass>,
        preference_shift: Option<char>,
    ) -> Vec<ScheduleOption> {
        // Agrupa as turmas candidatas por disciplina
        let mut by_discipline: HashMap<String, Vec<ScrapedClass>> = HashMap::new();
        for class_item in candidate_classes {
            by_discipline
                .entry(class_item.discipline_code.clone())
                .or_default()
                .push(class_item);
        }

        let discipline_groups: Vec<Vec<ScrapedClass>> = by_discipline.into_values().collect();

        if discipline_groups.is_empty() {
            return Vec::new();
        }

        // Produto cartesiano para testar todas as combinações
        let mut combinations: Vec<Vec<ScrapedClass>> = vec![vec![]];

        for group in &discipline_groups {
            let mut next_combinations = Vec::new();
            for current_comb in combinations {
                for class_option in group {
                    let mut extended = current_comb.clone();
                    extended.push(class_option.clone());
                    next_combinations.push(extended);
                }
            }
            combinations = next_combinations;
            // Limite de segurança para evitar explosão combinatória
            if combinations.len() > 500 {
                combinations.truncate(500);
            }
        }

        // Filtra combinações sem conflito e pontua
        let mut valid_options: Vec<ScheduleOption> = Vec::new();

        for (idx, comb) in combinations.into_iter().enumerate() {
            let conflicts = Self::find_conflicts(&comb);
            let has_conflict = !conflicts.is_empty();

            if !has_conflict {
                let score = Self::calculate_score(&comb, preference_shift);
                valid_options.push(ScheduleOption {
                    id: format!("opt-{}", idx + 1),
                    classes: comb,
                    has_conflict: false,
                    conflicts: Vec::new(),
                    score,
                });
            }
        }

        // Ordena por maior pontuação (melhor adequação de horários e preferências)
        valid_options.sort_by_key(|b| std::cmp::Reverse(b.score));

        valid_options
    }
}
