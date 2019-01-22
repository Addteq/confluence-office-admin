/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package com.addteq.confluence.plugin.avatar;

import com.atlassian.user.User;

/**
 *
 * @author vkumar
 */
public interface AvatarManager {
    public byte[] getAvatar(String secretKey, int size) throws Exception;
    public UserSecretDB generateMD5(User user);
}
