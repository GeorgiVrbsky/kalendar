package com.krizik.kalendar.service;

import com.krizik.kalendar.entity.Reminder;
import com.krizik.kalendar.entity.User;
import com.krizik.kalendar.repository.ReminderRepository;
import com.krizik.kalendar.repository.UserRepository;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class ReminderService {

    private final ReminderRepository reminderRepository;
    private final UserRepository userRepository;

    @Autowired
    private HttpSession session;

    public ReminderService(ReminderRepository reminderRepository, UserRepository userRepository) {
        this.reminderRepository = reminderRepository;
        this.userRepository = userRepository;
    }

    public List<Reminder> getRemindersForDate(LocalDate date) {
        return reminderRepository.findByReminderDate(date);
    }

    private String getCurrentUsername() {
        User loggedUser = (User) session.getAttribute("LOGGED_USER");
        if (loggedUser == null) {
            throw new RuntimeException("Uživatel není přihlášen (Session vypršela)");
        }
        return loggedUser.getUsername();
    }

    @Transactional
    public Reminder createReminder(String title, String description, LocalDate date, LocalTime time, boolean isAllDay, List<String> usernames, String color) {
        String owner = getCurrentUsername();
        Reminder reminder = new Reminder(title, description, date, time, isAllDay, color, owner);

        if (usernames == null) usernames = new ArrayList<>();

        // Owner musi byt v participantech
        if (!usernames.contains(owner)) {
            usernames.add(owner);
        }

        for (String username : usernames) {
            userRepository.findByUsername(username).ifPresent(reminder::addParticipant);
        }

        return reminderRepository.save(reminder);
    }

    @Transactional
    public Reminder updateReminder(Long id, String title, String description, LocalDate date, LocalTime time, boolean isAllDay, List<String> usernames, String color) {
        String currentUsername = getCurrentUsername();
        Reminder reminder = reminderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Připomínka nenalezena"));

        //Pouze owner muze upravovat data
        if (!currentUsername.equals(reminder.getOwner())) {
            throw new RuntimeException("Nemáte právo upravovat cizí událost.");
        }

        reminder.setTitle(title);
        reminder.setDescription(description);
        reminder.setReminderDate(date);
        reminder.setReminderTime(time);
        reminder.setAllDay(isAllDay);
        reminder.setColor(color);

        // Reset participantu
        reminder.getParticipants().forEach(user -> user.getReminders().remove(reminder));
        reminder.getParticipants().clear();

        if (usernames == null) usernames = new ArrayList<>();

        // Owner musi zustat
        if (!usernames.contains(currentUsername)) {
            usernames.add(currentUsername);
        }

        for (String username : usernames) {
            userRepository.findByUsername(username).ifPresent(reminder::addParticipant);
        }

        return reminderRepository.save(reminder);
    }

    @Transactional
    public void deleteReminder(Long id) {
        String currentUsername = getCurrentUsername();

        Reminder reminder = reminderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Připomínka nenalezena"));

        boolean isOwner = currentUsername.equals(reminder.getOwner());

        if (isOwner) {
            //pokud jsem owner dal DELETE{id} tak to smazu pro vsechny
            for (User user : reminder.getParticipants()) {
                user.getReminders().remove(reminder);
            }
            reminder.getParticipants().clear();
            reminderRepository.delete(reminder);
        } else {
            //pokud maze host, tak se jenom odpoji
            User me = reminder.getParticipants().stream()
                    .filter(u -> u.getUsername().equals(currentUsername))
                    .findFirst()
                    .orElseThrow(() -> new RuntimeException("Nejste ucastnikem tohoto reminderu"));

            me.getReminders().remove(reminder);
            reminder.getParticipants().remove(me);
            reminderRepository.save(reminder); // Pouze zmena v participantech
        }

    }

    public List<Reminder> getAllRemindersForUser(String username){
        return reminderRepository.findByParticipants_UsernameOrderByReminderDateAsc(username);
    }
}