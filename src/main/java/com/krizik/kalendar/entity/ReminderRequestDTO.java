package com.krizik.kalendar.entity;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Setter
@Getter
public class ReminderRequestDTO {

    private String title;
    private String description;
    private LocalDate date;
    private LocalTime time;
    private boolean allDay;
    private List<String> usernames;
    private String color;


}
