package com.krizik.kalendar.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "reminders")
@Getter
@Setter
public class Reminder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(length = 255)
    private String description;

    @Column(name = "reminder_date", nullable = false)
    private LocalDate reminderDate;

    @Column(name = "reminder_time")
    private LocalTime reminderTime; // Může být null (pokud je to celý den)

    @Column(name = "is_all_day", nullable = false)
    private boolean allDay = false; // Výchozí je, že to má čas

    private String color;

    @ManyToMany(fetch = FetchType.LAZY, cascade = {CascadeType.PERSIST, CascadeType.MERGE})
    @JoinTable(
            name = "reminder_participants",
            joinColumns = @JoinColumn(name = "reminder_id"),
            inverseJoinColumns = @JoinColumn(name = "user_id")
    )
    private Set<User> participants = new HashSet<>();

    public Reminder() {}

    public Reminder(String title, String description, LocalDate reminderDate, LocalTime reminderTime, boolean allDay, String color) {
        this.title = title;
        this.description = description;
        this.reminderDate = reminderDate;
        this.reminderTime = reminderTime;
        this.allDay = allDay;
        this.color = color;
    }

    public void addParticipant(User user) {
        this.participants.add(user);
        user.getReminders().add(this);
    }

    public void removeParticipant(User user) {
        this.participants.remove(user);
        user.getReminders().remove(this);
    }

}