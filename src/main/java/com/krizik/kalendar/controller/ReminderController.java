package com.krizik.kalendar.controller;

import com.krizik.kalendar.entity.Reminder;
import com.krizik.kalendar.entity.ReminderRequestDTO;
import com.krizik.kalendar.entity.User;
import com.krizik.kalendar.service.ReminderService;
import jakarta.servlet.http.HttpSession;
import org.springframework.web.bind.annotation.*;

import java.nio.file.AccessDeniedException;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/reminders")
public class ReminderController {

    private final ReminderService reminderService;

    public ReminderController(ReminderService reminderService) {
        this.reminderService = reminderService;
    }

    @GetMapping
    public List<Reminder> getReminders(@RequestParam String date, HttpSession session) {
        User loggedUser = (User) session.getAttribute("LOGGED_USER");
        if (loggedUser == null) {
            throw new RuntimeException("Nejste přihlášen!");
        }
        LocalDate localDate = LocalDate.parse(date);
        return reminderService.getRemindersForDate(localDate);
    }

    @PostMapping
    public Reminder addReminder(@RequestBody ReminderRequestDTO request) {

        return reminderService.createReminder(
                request.getTitle(),
                request.getDescription(),
                request.getDate(),
                request.getTime(),
                request.isAllDay(),
                request.getUsernames(),
                request.getColor()
        );
    }

    @PutMapping("/{id}")
    public Reminder updateReminder(@PathVariable Long id, @RequestBody ReminderRequestDTO request) {
        return reminderService.updateReminder(
                id,
                request.getTitle(),
                request.getDescription(),
                request.getDate(),
                request.getTime(),
                request.isAllDay(),
                request.getUsernames(),
                request.getColor()
        );
    }

    @DeleteMapping("/{id}")
    public void deleteReminder(@PathVariable Long id){
        reminderService.deleteReminder(id);
    }

    @GetMapping("/all")
    public List<Reminder> getAllReminders(HttpSession session) {
        User loggedUser = (User) session.getAttribute("LOGGED_USER");
        if (loggedUser == null) {
            throw new RuntimeException("Nejste prihlasen");
        }
        return reminderService.getAllRemindersForUser(loggedUser.getUsername());
    }
}
