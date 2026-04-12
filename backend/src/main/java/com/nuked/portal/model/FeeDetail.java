package com.nuked.portal.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "fee_details")
public class FeeDetail {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "fee_challan_id")
    private FeeChallan feeChallan;

    private String description;

    private Double arrears;

    private Double due;

    private Double discount;

    private Double sponsored;

    private Double collection;

    private Double balance;

    private String instrumentNo;

    private String instrumentType;
}
