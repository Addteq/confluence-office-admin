/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package com.addteq.confluence.plugin.floorplan;

import com.atlassian.activeobjects.external.ActiveObjects;
import com.atlassian.confluence.content.render.xhtml.ConversionContext;
import com.atlassian.confluence.content.render.xhtml.DefaultConversionContext;
import com.atlassian.confluence.core.ContentEntityObject;
import com.atlassian.confluence.macro.Macro;
import com.atlassian.confluence.macro.MacroExecutionException;
import com.atlassian.confluence.pages.Attachment;
import com.atlassian.confluence.pages.AttachmentManager;
import com.atlassian.confluence.pages.PageManager;
import com.atlassian.confluence.renderer.PageContext;
import com.atlassian.confluence.renderer.radeox.macros.MacroUtils;
import com.atlassian.confluence.setup.BootstrapManager;
import com.atlassian.confluence.setup.settings.SettingsManager;
import com.atlassian.confluence.user.AuthenticatedUserThreadLocal;
import com.atlassian.confluence.user.ConfluenceUser;
import com.atlassian.confluence.util.ConfluenceHomeGlobalConstants;
import com.atlassian.confluence.util.velocity.VelocityUtils;
import com.atlassian.renderer.RenderContext;
import com.atlassian.renderer.TokenType;
import com.atlassian.renderer.v2.RenderMode;
import com.atlassian.renderer.v2.macro.BaseMacro;
import com.atlassian.renderer.v2.macro.MacroException;
import com.atlassian.sal.api.transaction.TransactionCallback;
import com.atlassian.spring.container.ContainerManager;
import com.atlassian.upm.api.license.PluginLicenseManager;
import com.atlassian.upm.api.license.entity.PluginLicense;
import com.atlassian.user.GroupManager;
import java.awt.image.BufferedImage;
import java.awt.image.BufferedImageOp;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.URL;
import java.net.URLConnection;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.logging.Level;
import java.util.logging.Logger;
import javax.imageio.ImageIO;
import org.apache.commons.httpclient.URIException;
import org.apache.commons.httpclient.util.URIUtil;
import org.apache.commons.io.IOUtils;
import org.imgscalr.Scalr;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.select.Elements;

/**
 *
 * @author addteq
 */
public class FlowDiagramMacro extends BaseMacro implements Macro {

    private String imgHtml = "";
    private StringBuilder img;
    private String macroId = "";
    private int viewportwidth = 0;
    private final PluginLicenseManager licenseManager;
    private final AttachmentManager attachmentManager;
    private final PageManager pageManager;
    private String checksum = "";
    private final ActiveObjects ao;
    private final SettingsManager settingsManager;
    private final GroupManager groupManager;

    public FlowDiagramMacro(AttachmentManager attachmentManager, PageManager pageManager,
            ActiveObjects ao, PluginLicenseManager licenseManager, SettingsManager settingsManager,
            GroupManager groupManager) {
        this.attachmentManager = attachmentManager;
        this.pageManager = pageManager;
        this.ao = ao;
        this.licenseManager = licenseManager;
        this.settingsManager = settingsManager;
        this.groupManager = groupManager;
    }

    @Override
    public String execute(Map parameters, String body, RenderContext renderContext)
            throws MacroException {
        try {
            return execute(parameters, body, new DefaultConversionContext(renderContext));
        } catch (MacroExecutionException e) {
            throw new MacroException(e.getMessage());
        }
    }

    @Override
    public String execute(Map<String, String> arg0, String macroUserInput, ConversionContext conversionContext) throws MacroExecutionException {
        ConfluenceUser confluenceUser = AuthenticatedUserThreadLocal.get();
        if(confluenceUser == null) {
            String msg = "Office Admin: Anonymous user does not have access to the Flow Diagram macro.";
                    String expirationMessage = "<div class=\"aui-message warning \">"
                            + "<p class=\"title\">"
                            + "<span class=\"aui-icon icon-warning\"></span>"
                            + "<strong>" + msg +"</strong></p>"
                            + "</div>";
                    return expirationMessage + "</br>" + macroUserInput;
        }
        String contextPATH=settingsManager.getGlobalSettings().getBaseUrl();
        String redirectURL=contextPATH+"/plugins/servlet/upm/manage/all#manage";
        try {
            if (licenseManager.getLicense().isDefined()) {
                PluginLicense pluginLicense = licenseManager.getLicense().get();
                if (pluginLicense.getError().isDefined()) {
                    // handle license error scenario
                    // (e.g., expiration or user mismatch)
                    String msg = "Office Admin plugin: license " + pluginLicense.getError().get().name().toLowerCase();
                    String expirationMessage = "<div class=\"aui-message warning officeAdminUnlicensedError\">"
                            + "<p class=\"title\">"
                            + "<span class=\"aui-icon icon-warning\"></span>"
                            + "<strong>" + msg + ". Please "+"<a href='"+redirectURL+"'>install</a>"+" a license."+"</strong></p>"
                            + "</div>";
                    return expirationMessage + "</br>" + macroUserInput;
                } else {
                    Map<String, Object> contextMap = MacroUtils.defaultVelocityContext();
                    Document userInput = Jsoup.parse(macroUserInput);
                    Elements imgEle = userInput.getElementsByTag("img");
                 
                    if (imgEle.isEmpty() || (!imgEle.hasAttr("src") && !imgEle.hasAttr("data-image-src"))) {
                        contextMap.put("img", "");
                        return VelocityUtils.getRenderedTemplate("template/floorPlanMacro.vm", contextMap);
                    }
                    macroId = arg0.get("macro-id");
                    boolean showAllRecords = "true".equals(arg0.get("showallrecords"));

                    PageContext pageContext = conversionContext.getPageContext();
                    ContentEntityObject contentEntityObject = pageContext.getEntity();
                    
                    AllotArea allotArea = new AllotArea(ao, pageManager, null, null, null, null , null, null, null);
                    img = new StringBuilder("");

                    try {
                        String urlOfNewImage = "", imgTag = "";
                        BootstrapManager bootstrapManager = (BootstrapManager) ContainerManager.getComponent("bootstrapManager");
                        BufferedImage readImage;
                        Integer imgHeight = 0, imgWidth = 0;
                        if (imgEle.attr("src").contains("http://") || imgEle.attr("src").contains("https://")) {
                            checksum = getChecksum(contentEntityObject, "", imgEle.attr("src"));

                            /**
                             * In some cases URL cant be accessed directly with
                             * new URL(); it throws 403 exception hence added
                             * RequestProperty to URLConnection. 
                             * Refered: http://stackoverflow.com/questions/25630202/couldnt-download-image
                             **/
                            URLConnection openConnection = new URL(imgEle.attr("src")).openConnection();
                            openConnection.addRequestProperty("User-Agent", "Mozilla/5.0 (Windows NT 6.1; WOW64; rv:25.0) Gecko/20100101 Firefox/25.0");
                            readImage = ImageIO.read(openConnection.getInputStream());
                            
                            imgHeight = readImage.getHeight();
                            imgWidth = readImage.getWidth();

                            if (imgWidth > 3072) {
                                HashMap<String, String> mappingImage = checkIfResizedImageExists(checksum);
                                if (mappingImage != null) {
                                    checksum = mappingImage.get("checksum");
                                    Attachment mappingAttachment = attachmentManager.getAttachment(Long.parseLong(mappingImage.get("attachmentId")));
                                    urlOfNewImage = mappingAttachment.getDownloadPath();
                                    imgTag = "src=\"" + bootstrapManager.getWebAppContextPath() + urlOfNewImage + "\"";
                                } else {
                                    Attachment result = addImagetoPage(null, contentEntityObject, readImage, imgEle.attr("src"));
                                    urlOfNewImage = result.getDownloadPath();
                                    String resizedChecksum = getChecksum(contentEntityObject, result.getFileName(), null);
                                    addMappingOfResizedImage(checksum, resizedChecksum, result.getIdAsString());
                                    imgTag = "src=\"" + bootstrapManager.getWebAppContextPath() + urlOfNewImage + "\"";
                                }
                            } else {
                                imgTag = "src=\""+imgEle.attr("src")+"\"";
                            }

                        } else {
                            String attachmentFileName = imgEle.attr("src"); 
                            attachmentFileName = attachmentFileName.substring(attachmentFileName.lastIndexOf("/") + 1, attachmentFileName.indexOf("?version="));
                            checksum = getChecksum(contentEntityObject, URIUtil.decode(attachmentFileName), null);
                            Attachment imageFile = attachmentManager.getAttachment(contentEntityObject, URIUtil.decode(attachmentFileName));
                            File tempDirectory = new File(bootstrapManager.getApplicationHome(), ConfluenceHomeGlobalConstants.PLUGINS_TEMP_DIR);
                            File imageForSizeCalculation = new File(tempDirectory.getAbsolutePath()+ System.getProperty("file.separator") + "temporary");
                            OutputStream outputStream = new FileOutputStream(imageForSizeCalculation);
                            IOUtils.copy(attachmentManager.getAttachmentData(imageFile), outputStream);
                            outputStream.close();
                            readImage = ImageIO.read(imageForSizeCalculation);
                            imgHeight = readImage.getHeight();
                            imgWidth = readImage.getWidth();
                            if (imgWidth > 3072) {
                                HashMap<String, String> mappingImage = checkIfResizedImageExists(checksum);
                                if (mappingImage != null) {
                                    checksum = mappingImage.get("checksum");
                                    Attachment mappingAttachment = attachmentManager.getAttachment(Long.parseLong(mappingImage.get("attachmentId")));
                                    urlOfNewImage = mappingAttachment.getDownloadPath();
                                    imgTag = "src=\"" + bootstrapManager.getWebAppContextPath() + urlOfNewImage + "\"";
                                } else {
                                    Attachment result = addImagetoPage(imageFile, contentEntityObject, readImage, null);
                                    urlOfNewImage = result.getDownloadPath();
                                    String resizedChecksum = getChecksum(contentEntityObject, result.getFileName(), null);
                                    addMappingOfResizedImage(checksum, resizedChecksum, result.getIdAsString());
                                    imgTag = "src=\"" + bootstrapManager.getWebAppContextPath() + urlOfNewImage + "\"";
                                }
                            } else {
                                imgTag = "src=\""+imgEle.attr("src")+"\"";
                            }

                        }
                        viewportwidth = allotArea.getViewPortWidth(macroId);                        
                        String width = "";
                        if (imgWidth > viewportwidth) {
                            imgHeight = (imgHeight * viewportwidth) / imgWidth;
                            imgWidth = viewportwidth;
                        }

                        if(Integer.parseInt(imgWidth.toString()) >= 1200){
                            width = "1200";
                        }
                        else
                            width = imgWidth.toString();
                        
                        img.append("<div id=\"showAllandSearchDiv\" style=\"position:relative; width:"+ width +"px; height:35px;\">"                                
                            + "<div style=\"width: 250px; position:relative; float:right; margin-left:10px;\" >\n"
                            + "<form class=\"aui\" method=\"POST\" name=\"searchform\" id=\"searchform\" onsubmit=\"return false;\">"
                            + "<input placeholder=\"Search\" class=\"text\" type=\"text\" id=\"userSearch\" name=\"userSearch\" data-none-message=\"No matches\" style=\"width: 250px !important; border-radius:3px; \">\n"
                            + "</input> "
                            + "</form>"
                            + "</div>"
                            + "<div class=\"taggedList\" style=\"position:relative !important;  float:right;\" id=\"listDiv\" title=\"Tagged Users and Areas\"> </div> \n"
                            + "<span id='floor-plan-export' title='Export' class='hidden aui-icon aui-icon-large aui-iconfont-export'>Export</span>"
                            + "<span id='floor-plan-import' title='Import' class='hidden aui-icon aui-icon-large aui-iconfont-devtools-pull-request'>Import</span>"
                            + "</div>");
                        img.append("<div class=\"pancontainer\" id=\"pancontainerid\" data-orient=\"center\" data-canzoom=\"yes\" style=\"text-align: center; width:" + imgWidth.toString() + "px; height:" + imgHeight.toString() + "px;\" macro=\"flowdiagram\"> <img id='floorplanImage' style=\"width:" + imgWidth.toString() + "px; height:" + imgHeight.toString() + "px; position:relative !important;\" ");
//            img.append(macroUserInput.substring(macroUserInput.indexOf("src"), macroUserInput.indexOf("data-image-src") - 1));
                        img.append(imgTag);
                        img.append(" /></div>");
                        img.append("<div id=\"floorPlanTaggedDepartmentDiv\" style=\"position:relative; max-width:1200px; \"></div>");
                        img.append("<div id=\"floorPlanTaggedRoomDiv\" style=\"position:relative; max-width:1200px; \"></div>");
                        img.append("<div id='floorPlanTaggedUserDiv' style=\"position:relative;\"></div>");

                    } catch (URIException ex) {
                        Logger.getLogger(FlowDiagramMacro.class.getName()).log(Level.SEVERE, null, ex);
                    } catch (Exception ex) {
                        Logger.getLogger(FlowDiagramMacro.class.getName()).log(Level.SEVERE, null, ex);
                    }
                    img.append("<input type='hidden' id='floorPlanImageChecksum' value='").append(checksum).append("' />");
                    img.append("<input type='hidden' id='macroId' value='").append(macroId).append("' />");
                    contextMap.put("img", img);
                    contextMap.put("checksum", checksum);
                    contextMap.put("macroId", macroId);
                    contextMap.put("macroName", "flowdiagram");
                    contextMap.put("viewportwidth", Integer.toString(viewportwidth));
                    contextMap.put("showAllRecords", showAllRecords);

                    if (allotArea.isPermitted(contentEntityObject.getId(), "flowdiagram")) {
                        contextMap.put("editAllowed", true);
                    } else {
                        contextMap.put("editAllowed", false);
                    }

                    return VelocityUtils.getRenderedTemplate("template/floorPlanMacro.vm", contextMap);
                }
            } else {
                // handle unlicensed scenario
            String expirationMessage = "<div class=\"aui-message warning officeAdminUnlicensedError\">"
                    + "<p class=\"title\">"
                    + "<span class=\"aui-icon icon-warning\"></span>"
                    + "<strong>Office Admin plugin: unlicensed. Please "+"<a href='"+redirectURL+"'>install</a>"+" a license.</strong></p>"
                    + "</div>";
                return expirationMessage + "</br>" + macroUserInput;
            }
        } catch (Exception e) {
            Logger.getLogger(FlowDiagramMacro.class.getName()).log(Level.SEVERE, null, e);
            String expirationMessage = "<div class=\"aui-message warning officeAdminUnlicensedError\">"
                    + "<p class=\"title\">"
                    + "<span class=\"aui-icon icon-warning\"></span>"
                    + "<strong>Office Admin plugin: unlicensed. Please "+"<a href='"+redirectURL+"'>install</a>"+" a license.</strong></p>"
                    + "</div>";
            return expirationMessage + "</br>" + macroUserInput;
        }
    }

    /**
     * This method generates a MD5 checksum of the image using the the image
     * content which is then stored in the DB for unique identification.
     *
     * @param contentEntityObject
     * @param attachmentFileName
     * @param link
     * @return
     */
    private String getChecksum(ContentEntityObject contentEntityObject, String attachmentFileName, String link) {
        StringBuilder sb = new StringBuilder("");
        InputStream inputStream;
        try {
            if (link == null || link.isEmpty()) {
                Attachment attachment = attachmentManager.getAttachment(contentEntityObject, attachmentFileName);
                inputStream = attachment.getContentsAsStream();
            } else {
                /**
                 * In some cases URL cant be accessed directly with new URL();
                 * it throws 403 exception hence added RequestProperty to URLConnection. 
                 * Refered: http://stackoverflow.com/questions/25630202/couldnt-download-image
                 **/
                URLConnection openConnection = new URL(link).openConnection();
                openConnection.addRequestProperty("User-Agent", "Mozilla/5.0 (Windows NT 6.1; WOW64; rv:25.0) Gecko/20100101 Firefox/25.0");
                inputStream = openConnection.getInputStream();
            }
            MessageDigest messageDigest = MessageDigest.getInstance("MD5");
            byte[] dataBytes = new byte[1024];

            int bytesRead = 0;
            while ((bytesRead = inputStream.read(dataBytes)) != -1) {
                messageDigest.update(dataBytes, 0, bytesRead);
            }
            byte[] digestBytes = messageDigest.digest();
            for (int i = 0; i < digestBytes.length; i++) {
                sb.append(Integer.toString((digestBytes[i] & 0xff) + 0x100, 16).substring(1));
            }
            inputStream.close();
        } catch (NoSuchAlgorithmException nsaex) {
            Logger.getLogger(FlowDiagramMacro.class.getName()).log(Level.SEVERE, null, nsaex);
        } catch (FileNotFoundException fnfex) {
            Logger.getLogger(FlowDiagramMacro.class.getName()).log(Level.SEVERE, null, fnfex);
        } catch (IOException ioex) {
            Logger.getLogger(FlowDiagramMacro.class.getName()).log(Level.SEVERE, null, ioex);
        } catch (Exception ex) {
            Logger.getLogger(FlowDiagramMacro.class.getName()).log(Level.SEVERE, null, ex);
        }
        return sb.toString();
    }

    /**
     * Add the resized image of the floorplan or flowdiagram to the page
     * @param attachment
     * @param contentEntityObject
     * @param bufferedImage
     * @param link
     * @return 
     */
    public Attachment addImagetoPage(Attachment attachment, ContentEntityObject contentEntityObject, BufferedImage bufferedImage, String link) {
        Attachment temp = attachment;
        String extention, fileName;
        try {
            if (link == null || link.isEmpty()) {
                extention = attachment.getFileExtension();
                fileName = (attachment.getFileName()).replace("." + attachment.getFileExtension(), "");
                fileName = URIUtil.decode(fileName + "_FlowDiagram_Image." + attachment.getFileExtension());
            } else {
                extention = link.substring(link.lastIndexOf('.') + 1, link.length() - 1);
                fileName = link.substring(link.lastIndexOf('/') + 1, link.length()).replace("." + extention + "\"", "");
                fileName = URIUtil.decode(fileName + "_FlowDiagram_Image." + extention);
            }
            int imgHeight = bufferedImage.getHeight();
            int imgWidth = bufferedImage.getWidth();
            if (imgWidth > 3072) {
                imgHeight = (imgHeight * 3072) / imgWidth;
                imgWidth = 3072;
            }

            BufferedImageOp[] ops = new BufferedImageOp[1];

            BufferedImage resultImage = Scalr.resize(bufferedImage, Scalr.Mode.FIT_TO_WIDTH, imgWidth, imgHeight, ops);
            ByteArrayOutputStream os = new ByteArrayOutputStream();
            ImageIO.write(resultImage, extention, os);
            InputStream is = new ByteArrayInputStream(os.toByteArray());

            Attachment floorplanImage = new Attachment(fileName, extention, os.size(), "File generated and attached to the page by FlowDiagram Macro");
            floorplanImage.setLastModificationDate(new Date());
            floorplanImage.setLastModifier(AuthenticatedUserThreadLocal.get());
            floorplanImage.setCreator(AuthenticatedUserThreadLocal.get());
            floorplanImage.setCreationDate(new Date());

            contentEntityObject.addAttachment(floorplanImage);
            attachmentManager.saveAttachment(floorplanImage, null, is);

            temp = attachmentManager.getAttachment(floorplanImage.getId());

        } catch (Exception ex) {
            Logger.getLogger(FlowDiagramMacro.class.getName()).log(Level.SEVERE, null, ex);
        }
        return temp;
    }

    public HashMap<String, String> checkIfResizedImageExists(String originalImageChecksum) {

        ImageMappingDB[] imageMappingDB = ao.find(ImageMappingDB.class, "IMAGE_CHECKSUM = ? ", originalImageChecksum);
        if (imageMappingDB.length > 0) {
            HashMap<String, String> imageDetails = new HashMap<String, String>();
            imageDetails.put("checksum", imageMappingDB[0].getResizedImageChecksum());
            imageDetails.put("attachmentId", imageMappingDB[0].getAttachmentId());
            return imageDetails;
        } else {
            return null;
        }
    }

    /**
     * Associate the attachmentID to the original checksum and the resized checksum
     * @param originalChecksum
     * @param resizedChecksum
     * @param attachmentId 
     */
    public void addMappingOfResizedImage(final String originalChecksum, final String resizedChecksum, final String attachmentId) {
        ImageMappingDB imageMappingDB = ao.executeInTransaction(new TransactionCallback<ImageMappingDB>() {
            @Override
            public ImageMappingDB doInTransaction() {
                ImageMappingDB insertImageMappingDB = ao.create(ImageMappingDB.class);
                insertImageMappingDB.setAttachmentId(attachmentId);
                insertImageMappingDB.setImageChecksum(originalChecksum);
                insertImageMappingDB.setResizedImageChecksum(resizedChecksum);
                insertImageMappingDB.save();
                return insertImageMappingDB;
            }
        });
    }

    public StringBuilder getImg() {
        return img;
    }

    public void setImg(StringBuilder img) {
        this.img = img;
    }

    public String getImgHtml() {
        return imgHtml;
    }

    public void setImgHtml(String imgHtml) {
        this.imgHtml = imgHtml;
    }

    @Override
    public TokenType getTokenType(Map parameters, String body,
            RenderContext context) {
        return TokenType.INLINE;
    }

    @Override
    public boolean hasBody() {
        return true;
    }

    @Override
    public RenderMode getBodyRenderMode() {
        return RenderMode.ALL;
    }

    @Override
    public Macro.BodyType getBodyType() {
        return Macro.BodyType.RICH_TEXT;
    }

    @Override
    public Macro.OutputType getOutputType() {
        return Macro.OutputType.INLINE;
    }

    public String getChecksum() {
        return checksum;
    }

    public void setChecksum(String checksum) {
        this.checksum = checksum;
    }

}
