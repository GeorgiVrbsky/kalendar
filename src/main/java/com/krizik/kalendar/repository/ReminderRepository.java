package com.krizik.kalendar.repository;

import com.krizik.kalendar.entity.Reminder;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.time.LocalDate;

public interface ReminderRepository extends JpaRepository<Reminder, Long> {

    List<Reminder> findByReminderDate(LocalDate date);

    List<Reminder> findByParticipants_UsernameOrderByReminderDateAsc(String username);
}