package com.krizik.kalendar.service;

import com.krizik.kalendar.entity.Reminder;
import com.krizik.kalendar.entity.User;
import com.krizik.kalendar.repository.ReminderRepository;
import com.krizik.kalendar.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Service
public class ReminderService {

    private final ReminderRepository reminderRepository;
    private final UserRepository userRepository;

    public ReminderService(ReminderRepository reminderRepository, UserRepository userRepository) {
        this.reminderRepository = reminderRepository;
        this.userRepository = userRepository;
    }

    public List<Reminder> getRemindersForDate(LocalDate date) {
        return reminderRepository.findByReminderDate(date);
    }

    @Transactional
    public Reminder createReminder(String title, String description, LocalDate date, LocalTime time, boolean isAllDay, List<String> usernames, String color) {

        Reminder reminder = new Reminder(title, description, date, time, isAllDay, color);

        if (usernames != null) {
            for (String username : usernames) {
                userRepository.findByUsername(username).ifPresent(reminder::addParticipant);
            }
        }

        return reminderRepository.save(reminder);
    }

    @Transactional
    public Reminder updateReminder(Long id, String title, String description, LocalDate date, LocalTime time, boolean isAllDay, List<String> usernames, String color) {
        Reminder reminder = reminderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Připomínka nenalezena"));

        reminder.setTitle(title);
        reminder.setDescription(description);
        reminder.setReminderDate(date);
        reminder.setReminderTime(time);
        reminder.setAllDay(isAllDay);
        reminder.setColor(color);


        reminder.getParticipants().forEach(user -> user.getReminders().remove(reminder));
        reminder.getParticipants().clear();

        if (usernames != null) {
            for (String username : usernames) {
                userRepository.findByUsername(username).ifPresent(reminder::addParticipant);
            }
        }

        return reminderRepository.save(reminder);
    }

    @Transactional
    public void deleteReminder(Long id) {

        Reminder reminder = reminderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Připomínka nenalezena"));

        for (User user : reminder.getParticipants()) {
            user.getReminders().remove(reminder);
        }
        reminder.getParticipants().clear();

        reminderRepository.delete(reminder);
    }

    public List<Reminder> getAllRemindersForUser(String username){
        return reminderRepository.findByParticipants_UsernameOrderByReminderDateAsc(username);
    }
}
