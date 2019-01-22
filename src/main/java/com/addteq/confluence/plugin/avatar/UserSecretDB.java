/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package com.addteq.confluence.plugin.avatar;

import net.java.ao.Entity;

/**
 *
 * @author vkumar
 */
public interface UserSecretDB extends Entity{
    
    String getUsername();
    void setUsername(String username);
    
    String getSecretKey();
    void setSecretKey(String secretKey);
}
